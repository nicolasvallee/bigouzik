export interface MusicTrack {
  title: string
  src: string
  image?: string
  imageAlt?: string
  kickVelocityScale?: number
  sheetScale?: number
  loop?: boolean
}

export interface MusicTrackGroup {
  id: string
  title: string
  tracks: MusicTrack[]
}

export const trackGroups: MusicTrackGroup[] = [
  {
    id: 'funk',
    title: 'Funk',
    tracks: [
      { title: 'Funk', src: '/music/funk.musicxml', image: '/images/funk.png', sheetScale:0.7 },
      { title: 'Funk avec 6', src: '/music/funk-avec-6.musicxml', sheetScale:0.6 },
    ],
  },
  {
    id: 'rock',
    title: 'Rock',
    tracks: [
      { title: 'Rockito', src: '/music/rockito.musicxml',  image: '/images/rockito.png', sheetScale:0.6 },
    ],
  },
  
  {
    id: 'clown',
    title: 'Clown',
    tracks: [
      { title: 'Clown (sans intro)', src: '/music/clown.musicxml',   kickVelocityScale: 3,sheetScale:0.6
 },
      { title: 'Intro Clown', src: '/music/intro-clown.musicxml', kickVelocityScale: 3, sheetScale:0.6, loop:false
 },
    ],
  },
]
