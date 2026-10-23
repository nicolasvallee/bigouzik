"""Export the two Batuk drum kits without changing sample audio or synthesis settings.

Run from any directory: python3 scripts/trim-soundfont.py
"""

from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/soundfont/GeneralUser-GS.sf2'
TARGET = ROOT / 'public/soundfont/batuk-percussion.sf2'
PRESETS = {(128, 0), (128, 48)}


def chunks(data):
    offset = 0
    while offset < len(data):
        tag, size = struct.unpack_from('<4sI', data, offset)
        assert offset + 8 + size <= len(data), 'Truncated RIFF chunk'
        yield tag, data[offset + 8:offset + 8 + size]
        offset += 8 + size + size % 2
    assert offset == len(data)


def chunk(tag, data):
    return tag + struct.pack('<I', len(data)) + data + b'\0' * (len(data) % 2)


def u16(data, offset=0):
    return struct.unpack_from('<H', data, offset)[0]


def records(data, size):
    assert len(data) % size == 0
    return [data[i:i + size] for i in range(0, len(data), size)]


def generators(headers, bags, gens, index_offset, ids):
    for i in ids:
        for zone in range(u16(headers[i], index_offset), u16(headers[i + 1], index_offset)):
            yield from gens[u16(bags[zone]):u16(bags[zone + 1])]


def subset(headers, bags, gens, mods, index_offset, ids, reference_op, reference_map):
    new_headers, new_bags, new_gens, new_mods = [], [], [], []
    for i in sorted(ids):
        header = bytearray(headers[i])
        struct.pack_into('<H', header, index_offset, len(new_bags))
        new_headers.append(bytes(header))
        for zone in range(u16(headers[i], index_offset), u16(headers[i + 1], index_offset)):
            new_bags.append(struct.pack('<HH', len(new_gens), len(new_mods)))
            for gen in gens[u16(bags[zone]):u16(bags[zone + 1])]:
                if u16(gen) == reference_op:
                    gen = struct.pack('<HH', reference_op, reference_map[u16(gen, 2)])
                new_gens.append(gen)
            new_mods.extend(mods[u16(bags[zone], 2):u16(bags[zone + 1], 2)])
    terminal = bytearray(headers[-1])
    struct.pack_into('<H', terminal, index_offset, len(new_bags))
    new_headers.append(bytes(terminal))
    new_bags.append(struct.pack('<HH', len(new_gens), len(new_mods)))
    new_gens.append(gens[-1])
    new_mods.append(mods[-1])
    return [b''.join(items) for items in (new_headers, new_bags, new_gens, new_mods)]


def main():
    original = SOURCE.read_bytes()
    assert original[:4] == b'RIFF' and original[8:12] == b'sfbk'
    top = list(chunks(original[12:]))
    lists = {data[:4]: dict(chunks(data[4:])) for tag, data in top if tag == b'LIST'}
    pdta, sdta = lists[b'pdta'], lists[b'sdta']
    phdr, pbag, pmod, pgen = [records(pdta[tag], size) for tag, size in
                              [(b'phdr', 38), (b'pbag', 4), (b'pmod', 10), (b'pgen', 4)]]
    inst, ibag, imod, igen, shdr = [records(pdta[tag], size) for tag, size in
                                  [(b'inst', 22), (b'ibag', 4), (b'imod', 10), (b'igen', 4), (b'shdr', 46)]]
    preset_ids = {i for i, h in enumerate(phdr[:-1]) if (u16(h, 22), u16(h, 20)) in PRESETS}
    assert len(preset_ids) == len(PRESETS), 'Missing required drum kit'
    instrument_ids = {u16(g, 2) for g in generators(phdr, pbag, pgen, 24, preset_ids) if u16(g) == 41}
    used_gens = list(generators(inst, ibag, igen, 20, instrument_ids))
    sample_ids = {u16(g, 2) for g in used_gens if u16(g) == 53}
    # These kits only offset sample starts forward; all other address offsets are zero.
    # Fail rather than silently damage audio if the source bank changes this assumption.
    for gen in used_gens:
        if u16(gen) in {0, 1, 2, 3, 4, 12, 45, 50}:
            amount = struct.unpack_from('<h', gen, 2)[0]
            assert (u16(gen) == 0 and amount >= 0) or amount == 0
    pending = list(sample_ids)
    while pending:
        sample = shdr[pending.pop()]
        sample_type = u16(sample, 44)
        assert not sample_type & 0x8000, 'ROM samples cannot be exported'
        if sample_type & 14:
            linked = u16(sample, 42)
            if linked not in sample_ids:
                sample_ids.add(linked)
                pending.append(linked)

    # Merge overlapping sample ranges so shared PCM is copied once, with SF2 guard samples.
    intervals = []
    for i in sorted(sample_ids, key=lambda i: struct.unpack_from('<I', shdr[i], 20)[0]):
        start, end, loop_start, loop_end = struct.unpack_from('<IIII', shdr[i], 20)
        assert start <= loop_start <= loop_end <= end
        end += 46
        assert end * 2 <= len(sdta[b'smpl'])
        if intervals and start <= intervals[-1][1]:
            intervals[-1][1] = max(intervals[-1][1], end)
        else:
            intervals.append([start, end])
    pcm, positions = bytearray(), []
    for start, end in intervals:
        positions.append((start, end, len(pcm) // 2 - start))
        pcm.extend(sdta[b'smpl'][start * 2:end * 2])
    sample_map = {old: new for new, old in enumerate(sorted(sample_ids))}
    new_shdr = []
    for i in sorted(sample_ids):
        header = bytearray(shdr[i])
        points = struct.unpack_from('<IIII', header, 20)
        delta = next(delta for start, end, delta in positions if start <= points[0] < end)
        struct.pack_into('<IIII', header, 20, *(point + delta for point in points))
        struct.pack_into('<H', header, 42, sample_map[u16(header, 42)] if u16(header, 44) & 14 else 0)
        new_shdr.append(bytes(header))
    terminal = bytearray(shdr[-1])
    struct.pack_into('<IIII', terminal, 20, *([len(pcm) // 2] * 4))
    new_shdr.append(bytes(terminal))
    instrument_map = {old: new for new, old in enumerate(sorted(instrument_ids))}
    new_phdr, new_pbag, new_pgen, new_pmod = subset(phdr, pbag, pgen, pmod, 24, preset_ids, 41, instrument_map)
    new_inst, new_ibag, new_igen, new_imod = subset(inst, ibag, igen, imod, 20, instrument_ids, 53, sample_map)
    tables = dict(zip([b'phdr', b'pbag', b'pmod', b'pgen', b'inst', b'ibag', b'imod', b'igen', b'shdr'],
                      [new_phdr, new_pbag, new_pmod, new_pgen, new_inst, new_ibag, new_imod, new_igen, b''.join(new_shdr)]))
    new_sdta = chunk(b'smpl', bytes(pcm))
    if b'sm24' in sdta:
        new_sdta += chunk(b'sm24', b''.join(sdta[b'sm24'][start:end] for start, end in intervals))
    body = b'sfbk'
    for tag, data in top:
        if tag == b'LIST' and data[:4] == b'sdta':
            data = b'sdta' + new_sdta
        elif tag == b'LIST' and data[:4] == b'pdta':
            data = b'pdta' + b''.join(chunk(key, value) for key, value in tables.items())
        body += chunk(tag, data)
    result = chunk(b'RIFF', body)
    TARGET.write_bytes(result)
    print(f'{SOURCE.name}: {len(original):,} bytes → {TARGET.name}: {len(result):,} bytes')
    print(f'Kept {len(preset_ids)} kits, {len(instrument_ids)} instruments and {len(sample_ids)} samples; original INFO/license preserved.')


if __name__ == '__main__':
    main()
