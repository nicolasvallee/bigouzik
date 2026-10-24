<script setup lang="ts">
import { trackGroups } from '@/data/trackGroups'
import MusicTrackGroup from './MusicTrackGroup.vue'

const rioExample = trackGroups.find((group) => group.id === 'rio')?.tracks
  .filter((track) => track.src === '/music/rio1.musicxml') ?? []

const noteValues = [
  { name: 'Ronde', beats: '4 temps', restName: 'Pause', restSymbol: '\uE4E3', hollow: true, stem: false, flags: 0 },
  { name: 'Blanche', beats: '2 temps', restName: 'Demi-pause', restSymbol: '\uE4E4', hollow: true, stem: true, flags: 0 },
  { name: 'Noire', beats: '1 temps', restName: 'Soupir', restSymbol: '\uE4E5', dottedBeats: '1 + ½ = 1½ temps', hollow: false, stem: true, flags: 0 },
  { name: 'Croche', beats: '½ temps', restName: 'Demi-soupir', restSymbol: '\uE4E6', dottedBeats: '½ + ¼ = ¾ de temps', hollow: false, stem: true, flags: 1 },
  { name: 'Double croche', beats: '¼ de temps', restName: 'Quart de soupir', restSymbol: '\uE4E7', hollow: false, stem: true, flags: 2 },
]

const dottedNoteValues = noteValues.filter((note) => note.dottedBeats)
</script>

<template>
  <section id="tuto" class="min-h-svh bg-background px-5 pb-20 pt-6 scroll-mt-20 sm:px-16 lg:px-36 [&_p]:text-justify" aria-labelledby="tuto-title">
    <div class="mx-auto w-full min-w-0 max-w-3xl">
      <h1 id="tuto-title" class="font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.9]">Tuto</h1>

      <details open class="group mt-6 border-t border-border pt-4" aria-labelledby="surdo-title">
        <summary class="flex cursor-pointer list-none items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <svg class="h-4 w-4 shrink-0 group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="m5 2 7 6-7 6Z" />
          </svg>
          <h2 id="surdo-title" class="min-w-0 font-serif text-3xl font-semibold sm:text-4xl">Les trois surdos</h2>
        </summary>
        <div class="mt-5 space-y-4 text-base leading-relaxed text-foreground">
          <p>
            Dans la plupart des rythmes qu'on joue, les surdos jouent ensemble la même phrase, sauf pour <strong>Rio</strong> et <strong>Clown</strong> 
            où les surdos sont répartis en trois groupes (parfois pour d'autres aussi comme <strong>Maracatu</strong>, ça depend des variantes... et de l'humeur!).
          </p>

            <p>Dans ces derniers cas, les surdos sont nommes dans l'ordre du
            du plus grave au plus aigu : <strong class="text-foreground">surdo 1</strong>,
            <strong class="text-foreground">surdo 2</strong> et <strong class="text-foreground">surdo 3</strong> et chaque groupe joue un rythme différent.
            </p>
          <div class="overflow-x-auto rounded-2xl border border-border">
            <table class="w-full text-left text-sm sm:text-base">
              <caption class="px-3 py-3 text-left font-semibold text-foreground sm:px-5">Règle générale</caption>
              <thead class="border-y border-border bg-background-soft text-foreground">
                <tr>
                  <th scope="col" class="px-3 py-3 sm:px-5">Surdo</th>
                  <th scope="col" class="px-3 py-3 sm:px-5">Partie jouée</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr>
                  <th scope="row" class="px-3 py-3 font-medium text-foreground sm:px-5">Surdo 1</th>
                  <td class="px-3 py-3 sm:px-5">Les temps 1 et 3</td>
                </tr>
                <tr>
                  <th scope="row" class="px-3 py-3 font-medium text-foreground sm:px-5">Surdo 2</th>
                  <td class="px-3 py-3 sm:px-5">Les temps 2 et 4</td>
                </tr>
                <tr>
                  <th scope="row" class="px-3 py-3 font-medium text-foreground sm:px-5">Surdo 3</th>
                  <td class="px-3 py-3 sm:px-5">Une mélodie entre ces temps</td>
                </tr>
              </tbody>
            </table>
          </div>
            <p><strong>Mais cette regle ne tient plus du tout pour Clown attention!</strong>
            </p>
            <p>            J'ai essayé au maximum de trouver des sons qui soient fideles a la realite, mais ce n'est peut etre pas evident de savoir
               qui est qui a l'ecoute ! 
              Dans ce cas, vous pouvez essayer d'activer le mode <strong>Partoches</strong> ou <strong>Cercles</strong> 
              pour voir les notes colorees. Ici l'exemple avec <strong>Rio 1</strong>
</p>
        
        </div>
        <div class="mt-6">
          <MusicTrackGroup
            id="rio"
            :tracks="rioExample"
            :show-sheets="true"
            :show-circles="true"
            :playback-speed="1"
            selected-track="both"
          />
        </div>
      </details>

      <details open class="group mt-6 border-t border-border pt-4" aria-labelledby="notes-title">
        <summary class="flex cursor-pointer list-none items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <svg class="h-4 w-4 shrink-0 group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="m5 2 7 6-7 6Z" />
          </svg>
          <h2 id="notes-title" class="min-w-0 font-serif text-3xl font-semibold sm:text-4xl">Comprendre les partoches</h2>
        </summary>
        <p class="mt-5 text-base leading-relaxed text-foreground">
          Il n'est pas du tout necessaire d'apprendre les partitions pour jouer ensemble, notre Batuk a longtemps existe sans! :) 
           Mais ca reste un outil assez puissant pour transmettre des idees musicales alors voici brievement quelques infos si vous souhaitez les comprendre.

          </p>

        <p class="mt-4">
          La forme d’une note indique sa durée. Pour commencer, prenons la noire comme unité :
          <strong class="text-foreground">une noire vaut un temps</strong>, c’est-à-dire une pulsation
          régulière que l’on peut suivre du pied.
        </p>
        <div class="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table class="w-full text-left text-sm sm:text-base">
            <caption class="sr-only">Valeurs des notes lorsque la noire vaut un temps</caption>
            <thead class="border-b border-border bg-background-soft">
              <tr>
                <th scope="col" class="px-3 py-3 sm:px-5">Note</th>
                <th scope="col" class="px-3 py-3 sm:px-5">Durée</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="note in noteValues" :key="note.name">
                <th scope="row" class="px-3 py-3 font-medium sm:px-5">
                  <span class="flex items-center gap-2 sm:gap-3">
                    <svg class="h-12 w-8 shrink-0" viewBox="0 0 32 48" aria-hidden="true">
                      <ellipse cx="10" cy="36" rx="6" ry="4" transform="rotate(-20 10 36)" :fill="note.hollow ? 'none' : 'currentColor'" stroke="currentColor" stroke-width="2" />
                      <path v-if="note.stem" d="M15.5 35V6" fill="none" stroke="currentColor" stroke-width="2" />
                      <path v-if="note.flags >= 1" d="M15.5 6C16 14 29 13 23 25" fill="none" stroke="currentColor" stroke-width="2.5" />
                      <path v-if="note.flags === 2" d="M15.5 13C16 21 29 20 23 32" fill="none" stroke="currentColor" stroke-width="2.5" />
                    </svg>
                    {{ note.name }}
                  </span>
                </th>
                <td class="px-3 py-3 sm:px-5">{{ note.beats }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-5 space-y-4 text-base leading-relaxed text-foreground">
          <p>
            Chaque valeur se divise en deux : une blanche vaut deux noires, une noire vaut deux croches,
            et une croche vaut deux doubles croches. Dans une mesure à 4/4, on peut donc placer
            4 noires, 8 croches ou 16 doubles croches, ou mélanger ces valeurs pour remplir les 4 temps...
          </p>
          <p>
            Quand plusieurs croches ou doubles croches se suivent, leurs petits crochets peuvent être
            remplacés par des barres qui les relient. <strong>Leur durée reste la même</strong> :
            comptez les barres pour reconnaître les notes.
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <figure v-for="bars in [1, 2]" :key="bars" class="flex flex-col items-center gap-2 rounded-2xl border border-border p-3">
              <svg
                class="h-16 max-w-full"
                :class="bars === 1 ? 'w-24' : 'w-48'"
                :viewBox="bars === 1 ? '0 0 112 72' : '0 0 208 72'"
                role="img"
                :aria-label="bars === 1 ? 'Deux croches reliées par une barre' : 'Quatre doubles croches reliées par deux barres'"
              >
                <g fill="currentColor">
                  <template v-for="x in bars === 1 ? [28, 76] : [28, 76, 124, 172]" :key="x">
                    <ellipse :cx="x" cy="54" rx="8" ry="5" :transform="`rotate(-20 ${x} 54)`" />
                    <rect :x="x + 5" y="12" width="2" height="42" />
                  </template>
                  <rect x="33" y="12" :width="bars === 1 ? 50 : 146" height="6" />
                  <rect v-if="bars === 2" x="33" y="23" width="146" height="6" />
                </g>
              </svg>
              <figcaption class="text-center text-sm">
                <strong class="block">{{ bars === 1 ? '2 croches' : '4 doubles croches' }}</strong>
                <span class="mt-1 block">{{ bars === 1 ? '2 coups distincts, chacun dure ½ temps' : '4 coups distincts, chacun dure ¼ de temps' }}</span>
              </figcaption>
            </figure>
          </div>
        </div>
        <h3 class="mt-8 font-serif text-2xl font-semibold">Les notes pointées</h3>
        <p class="mt-4 leading-relaxed">
          Un point placé à droite d’une note <strong>ajoute la moitié de sa durée</strong>.
          Par exemple, une noire pointée vaut une noire plus une croche :
          <strong>1 temps + ½ temps = 1 temps et demi</strong>.
          Les points sont le plus couramment utilise pour les noires et les croches.
        </p>
        <div class="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table class="w-full text-left text-sm sm:text-base">
            <caption class="sr-only">Durée des notes pointées lorsque la noire vaut un temps</caption>
            <thead class="border-b border-border bg-background-soft">
              <tr>
                <th scope="col" class="px-3 py-3 sm:px-5">Note pointée</th>
                <th scope="col" class="px-3 py-3 sm:px-5">Durée + sa moitié</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="note in dottedNoteValues" :key="note.name">
                <th scope="row" class="px-3 py-3 font-medium sm:px-5">
                  <span class="flex items-center gap-2 sm:gap-3">
                    <svg class="h-12 w-10 shrink-0" viewBox="0 0 40 48" aria-hidden="true">
                      <ellipse cx="10" cy="36" rx="6" ry="4" transform="rotate(-20 10 36)" :fill="note.hollow ? 'none' : 'currentColor'" stroke="currentColor" stroke-width="2" />
                      <path v-if="note.stem" d="M15.5 35V6" fill="none" stroke="currentColor" stroke-width="2" />
                      <path v-if="note.flags >= 1" d="M15.5 6C16 14 29 13 23 25" fill="none" stroke="currentColor" stroke-width="2.5" />
                      <path v-if="note.flags === 2" d="M15.5 13C16 21 29 20 23 32" fill="none" stroke="currentColor" stroke-width="2.5" />
                      <circle cx="30" cy="35" r="2.5" fill="currentColor" />
                    </svg>
                    {{ note.name }} pointée
                  </span>
                </th>
                <td class="px-3 py-3 sm:px-5">{{ note.dottedBeats }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 class="mt-8 font-serif text-2xl font-semibold">Les silences</h3>
        <p class="mt-4 leading-relaxed">
          Les silences indiquent une durée pendant laquelle <strong>on ne joue pas</strong>,
          mais on continue de compter les temps.
        </p>
        <div class="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table class="w-full text-left text-sm sm:text-base">
            <caption class="sr-only">Durée des silences lorsque la noire vaut un temps</caption>
            <thead class="border-b border-border bg-background-soft">
              <tr>
                <th scope="col" class="px-3 py-3 sm:px-5">Silence</th>
                <th scope="col" class="px-3 py-3 sm:px-5">Durée</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="note in noteValues" :key="note.restName">
                <th scope="row" class="px-3 py-3 font-medium sm:px-5">
                  <span class="flex items-center gap-2 sm:gap-3">
                    <span class="rest-symbol inline-flex h-12 w-10 shrink-0 items-center justify-center" aria-hidden="true">{{ note.restSymbol }}</span>
                    {{ note.restName }}
                  </span>
                </th>
                <td class="px-3 py-3 sm:px-5">{{ note.beats }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  </section>
</template>

<style scoped>
@font-face {
  font-family: 'TutoMusic';
  src: url('/font/Bravura.woff2') format('woff2');
  font-display: swap;
}

.rest-symbol {
  font-family: 'TutoMusic';
  font-size: 3rem;
  font-weight: normal;
  line-height: 1;
}
</style>
