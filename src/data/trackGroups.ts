export interface MusicTrack {
  title: string
  src: string
  image?: string
  imageAlt?: string
  kickVelocityScale?: number
  sheetScale?: number
  loop: boolean
}

export interface MusicTrackGroup {
  id: string
  title: string
  tracks: MusicTrack[]
}

export const trackGroups: MusicTrackGroup[] = [
  {
    id: 'rio',
    title: 'Rio',
    tracks: [
      { title: 'Rio 1', src: '/music/rio1.musicxml', image: '/images/rio.png',kickVelocityScale: 3, sheetScale: 0.7, loop: true },
      { title: 'Rio2', src: '/music/rio2.musicxml', image: '/images/rio.png', kickVelocityScale: 3,sheetScale: 0.6, loop: true },
    ],
  },
   {
    id: 'diablo',
    title: 'Diablo',
    tracks: [
      { title: 'Diablo 1', src: '/music/diablo1.musicxml', image: '/images/diablo.png', sheetScale: 0.7, loop: true },
      { title: 'Diablo 2', src: '/music/diablo2.musicxml', image: '/images/diablo.png', sheetScale: 0.6, loop: true },
    ],
  },
  {
    id: 'funk',
    title: 'Funk',
    tracks: [
      { title: 'Funk', src: '/music/funk.musicxml', image: '/images/funk.png', sheetScale: 0.7, loop: true },
      { title: 'Funk avec 6', src: '/music/funk-avec-6.musicxml', sheetScale: 0.6, loop: true },
      { title: 'Cut 2-2', src: '/music/2-2.musicxml', image: '/images/2-2.png',  kickVelocityScale: 3, sheetScale: 0.6, loop: false },

    ],
  },
  {
    id: 'rock',
    title: 'Rock',
    tracks: [
      { title: 'Rockito', src: '/music/rockito.musicxml', image: '/images/rockito.png', sheetScale: 0.6, loop: true },
      { title: 'Rock 1', src: '/music/rock1.musicxml', image: '/images/rock.png', sheetScale: 0.6, loop: true },
      { title: 'Rock 2', src: '/music/rock2.musicxml', image: '/images/rock.png', sheetScale: 0.6, loop: true },


    ],
  },
  
  {
    id: 'clown',
    title: 'Clown',
    tracks: [
      { title: 'Clown (sans intro)', src: '/music/clown.musicxml',  image: '/images/clown.png', kickVelocityScale: 3, sheetScale: 0.6, loop: true },
      { title: 'Intro Clown', src: '/music/intro-clown.musicxml', kickVelocityScale: 3, sheetScale: 0.6, loop: false },
    ],
  },
  {
    id: 'maracatu',
    title: 'Maracatu',
    tracks: [
      { title: 'Maracatu', src: '/music/maracatu.musicxml',  image: '/images/maracatu.png',kickVelocityScale: 3, sheetScale: 0.6, loop: true },
    ],
  },
  {
    id: 'riboy',
    title: 'Riboy',
    tracks: [
      { title: 'Riboy', src: '/music/riboy.musicxml',  image: '/images/riboy.png', kickVelocityScale: 3, sheetScale: 0.6, loop: true },
    ],
  },
  {
    id: 'depart-rapide',
    title: 'Départ rapide',
    tracks: [
      { title: 'Départ rapide', src: '/music/depart-rapide.musicxml', kickVelocityScale: 3, sheetScale: 0.6, loop: true },
    ],
  },
   {
    id: 'cut-arret',
    title: 'Cut et arrêt',
    tracks: [
      { title: 'Cut 3 normal', src: '/music/cut3-normal.musicxml', kickVelocityScale: 3, sheetScale: 0.6, loop: true },
      { title: 'Cut shuffle', src: '/music/cut-shuffle.musicxml',  image: '/images/shuffle.png', kickVelocityScale: 3, sheetScale: 0.6, loop: true },

    ],
  },
]
