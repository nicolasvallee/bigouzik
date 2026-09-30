export interface MusicTrack {
  title: string
  src: string
  images?: string[]
  imageAlt?: string
  kickVelocityScale?: number
  sideStickVelocityScale?: number
  sheetScale?: number
  compound?: boolean
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
      { title: 'Rio 1', src: '/music/rio1.musicxml', images: ['/images/rio.png', '/images/1.png'],kickVelocityScale: 2, sheetScale: 0.7, loop: true },
      { title: 'Rio 2', src: '/music/rio2.musicxml', images: ['/images/rio.png', '/images/2.png'], kickVelocityScale: 2,sheetScale: 0.6, loop: true },
    ],
  },
   {
    id: 'diablo',
    title: 'Diablo',
    tracks: [
      { title: 'Diablo 1', src: '/music/diablo1.musicxml', images: ['/images/diablo.png', '/images/1.png'], kickVelocityScale: 1.5,   sideStickVelocityScale: 0.3,
 sheetScale: 0.7, loop: true },
      { title: 'Diablo 2', src: '/music/diablo2.musicxml', images: ['/images/diablo.png', '/images/2.png'],  kickVelocityScale: 1.5,   sideStickVelocityScale: 0.3,
sheetScale: 0.6, loop: true },
      { title: 'Arrêt 5', src: '/music/arret5.musicxml',  images: ['/images/arret5.png'], kickVelocityScale: 1.5, sheetScale: 0.6, loop: false },

      { title: 'Enchaînement Diablo 1 + Arrêt 5', src: '/music/diablo1-et-arret5.musicxml',   kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },

      { title: 'Enchaînement Diablo 2 + Arrêt 5', src: '/music/diablo2-et-arret5.musicxml', kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },

    ],
  },
  {
    id: 'funk',
    title: 'Funk',
    tracks: [
      { title: 'Funk', src: '/music/funk.musicxml', images: ['/images/funk.png'], sheetScale: 0.7, loop: true },
      { title: 'Funk avec 6', src: '/music/funk-avec-6.musicxml', sheetScale: 0.6, loop: true },
      { title: 'Cut 2-2 dans Funk', src: '/music/2-2.musicxml', images: ['/images/2-2.png'],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
      { title: 'Enchaînement des deux', src: '/music/funk-avec-6-et-cut22.musicxml', images: ['/images/2-2.png'],  kickVelocityScale: 1, sheetScale: 0.6, loop: true },


    ],
  },
  {
    id: 'rock',
    title: 'Rock',
    tracks: [
      { title: 'Rockito', src: '/music/rockito.musicxml', images: ['/images/rockito.png'], sheetScale: 0.6, loop: true },
      { title: 'Rock 1', src: '/music/rock1.musicxml', images: ['/images/rock.png', '/images/1.png'], kickVelocityScale: 3,sheetScale: 0.6, loop: true },
      { title: 'Rock 2', src: '/music/rock2.musicxml', images: ['/images/rock.png', '/images/2.png'], kickVelocityScale: 3,sheetScale: 0.6, loop: true },


    ],
  },
  
  {
    id: 'clown',
    title: 'Clown',
    tracks: [
      { title: 'Clown (sans intro)', src: '/music/clown.musicxml',  images: ['/images/clown.png'], kickVelocityScale: 2, sheetScale: 0.6, loop: true },
      { title: 'Intro Clown', src: '/music/intro-clown.musicxml', kickVelocityScale: 2, sideStickVelocityScale: 0.5, sheetScale: 0.6, loop: false },
    ],
  },{
    id: 'ternaire',
    title: 'Ternaire',
    tracks: [
      { title: 'Ternaire', src: '/music/ternaire.musicxml',  images: ['/images/ternaireA.png','/images/ternaireB.png' ],kickVelocityScale: 2, sideStickVelocityScale: 0.2, sheetScale: 0.6, compound: true, loop: true },
      { title: 'Cut 3 ternaire', src: '/music/cut3-ternaire.musicxml',  images: ['/images/cut.png','/images/ternaireC.png' ],kickVelocityScale: 2, sheetScale: 0.6, compound: true, loop: false },
      { title: 'Enchaînement des deux', src: '/music/ternaire+cut3ternaire.musicxml',  images: ['/images/ternaireA.png','/images/ternaireB.png','/images/cut.png','/images/ternaireC.png' ],kickVelocityScale: 2, sheetScale: 0.6, compound: true, loop: true },


    ],
  },
  {
    id: 'maracatu',
    title: 'Maracatu',
    tracks: [
      { title: 'Maracatu', src: '/music/maracatu.musicxml',  images: ['/images/maracatu.png'],kickVelocityScale: 1, sheetScale: 0.6, loop: true },
      { title: 'Cut 2-2 dans Maracatu', src: '/music/2-2maracatu.musicxml', images: ['/images/2-2.png'],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
      { title: 'Enchaînement des deux', src: '/music/maracatu-avec-cut22.musicxml', kickVelocityScale: 2, sheetScale: 0.6, loop: true },


    ],
  },
  {
    id: 'riboy',
    title: 'Riboy',
    tracks: [
      { title: 'Riboy', src: '/music/riboy.musicxml',  images: ['/images/riboy.png'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

    ],
  },
  {
    id: 'indiens',
    title: 'Indiens',
    tracks: [
      { title: 'Anges (en cours)', src: '/music/anges.musicxml', images: ['images/anges.png'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },
      { title: 'Indiens', src: '/music/indiens.musicxml',  images: ['/images/indiens.png'], kickVelocityScale: 1.5, sheetScale: 0.6, loop: true },
      { title: 'Cowboys (en cours)', src: '',  images: [], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

    ],
  },
  {
    id: 'dogfight',
    title: 'Dog fight',
    tracks: [
            { title: 'Dog fight (en cours)', src: '/music/dogfight.musicxml', images: [], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

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
      { title: 'Cut 3 normal', src: '/music/cut3-normal.musicxml',  images: ['/images/cut.png','/images/3.png' ], kickVelocityScale: 1, sheetScale: 0.6, loop: false },
      { title: 'Cut shuffle', src: '/music/cut-shuffle.musicxml',  images: ['/images/shuffle.png'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

    ],
  },
]
