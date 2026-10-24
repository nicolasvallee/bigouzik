export interface MusicTrack {
  title: string
  description?: string
  sheetDescription?: string
  src: string
  images?: string[]
  imageAlt?: string
  experimental?: boolean
  kickVelocityScale?: number
  sideStickVelocityScale?: number
  timbaleVolume?: number
  surdo1?: SurdoBeat[]
  surdo2?: SurdoBeat[]
  surdo3?: SurdoBeat[]
  sheetScale?: number
  showCircularView?: boolean
  circularRhythm?: CircularRhythmSection[]
  compound?: boolean
  loop: boolean
}

export interface MusicTrackGroup {
  id: string
  title: string
  description?: string
  tracks: MusicTrack[]
}

export interface CircularRhythmSection {
  fromMeasure: number
  toMeasure: number
  fromBeat?: number
  toBeat?: number
  repeats?: number
}

export interface SurdoBeat {
  measure: number
  beat?: number
}

export function trackId(track: Pick<MusicTrack, 'src' | 'title'>) {
  const name = track.src.split('/').pop()?.replace(/\.musicxml$/i, '') || track.title

  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const trackGroups: MusicTrackGroup[] = [
  {
    id: 'rio',
    title: 'Rio',
    description:"Dans les rythmes de Rio, on separe les surdos en trois groupes.",
    tracks: [
      { title: 'Rio 1', description:"", 
         src: '/music/rio1.musicxml', images: ['/images/rio.png', '/images/1.png'],
         surdo3: [
  { measure: 1, beat: 1 },
    { measure: 1, beat: 1.5 },

     { measure: 1, beat: 3 },
  { measure: 1, beat: 3.25 },

  { measure: 1, beat: 3.75 },
],
surdo1:[  { measure: 1, beat: 1 }, { measure: 1, beat: 3 }],
  
surdo2:[  { measure: 1, beat: 2 },
  { measure: 1, beat: 4 }
],
kickVelocityScale: 2, sheetScale: 0.7, loop: true },
     

 { title: 'Rio 1 avec Blocage 1', description:"Pour marquer une coupure. S'il n'est suivi d'aucun autre signe, on reprend le rythme Rio 1 juste après (même principe pour tous les cuts/arrêts)", 
         src: '/music/rio1-avec-blocage1.musicxml', images: ['/images/blocage1.png'],
         
          surdo3: [
  { measure: 1, beat: 1 },
    { measure: 1, beat: 1.5 },

     { measure: 1, beat: 3 },
  { measure: 1, beat: 3.25 },

  { measure: 1, beat: 3.75 },
  { measure: 2, beat: 1 },
    { measure: 2, beat: 1.5 },

     { measure: 2, beat: 3 },
  { measure: 2, beat: 3.25 },

  { measure: 2, beat: 3.75 },
    { measure: 3, beat: 2.5 },
    


],
surdo1:[  { measure: 1, beat: 1 }, { measure: 1, beat: 3 },
  { measure: 2, beat: 1 }, { measure: 2, beat: 3 },
      { measure: 3, beat: 2.5 },

],
  
surdo2:[  { measure: 1, beat: 2 },
  { measure: 1, beat: 4 },
   { measure: 2, beat: 2 },
  { measure: 2, beat: 4 },
      { measure: 3, beat: 3 },

],
circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 2 },

  { fromMeasure: 3, toMeasure: 3, repeats: 1 }],
    timbaleVolume:2,
     sheetScale: 0.6, 
kickVelocityScale: 2,  loop: true },

 { title: 'Rio 1 avec cut', description:"", 
         src: '/music/rio1-avec-cut.musicxml', images: ['/images/cut.png'],
       surdo3: [
  { measure: 1, beat: 1 },
    { measure: 1, beat: 1.5 },

     { measure: 1, beat: 3 },
  { measure: 1, beat: 3.25 },

  { measure: 1, beat: 3.75 },
  { measure: 2, beat: 1 },
    { measure: 2, beat: 1.5 },

     { measure: 2, beat: 3 },
  { measure: 2, beat: 3.25 },

  { measure: 2, beat: 3.75 },
  


],
surdo1:[  { measure: 1, beat: 1 }, { measure: 1, beat: 3 },
  { measure: 2, beat: 1 }, { measure: 2, beat: 3 },

],
  
surdo2:[  { measure: 1, beat: 2 },
  { measure: 1, beat: 4 },
   { measure: 2, beat: 2 },
  { measure: 2, beat: 4 },
         

],

circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },

  { fromMeasure: 3, toMeasure: 3, repeats: 1 },

  { fromMeasure: 4, toMeasure: 4, repeats: 1 }],
    timbaleVolume:2,
     sheetScale: 0.6, 
kickVelocityScale: 2,  loop: true },

{ title: 'Transition Rio 1 → Cut 2-2 → Funk', description:"Cut 2-2 sert souvent de transition entre Rio et [Funk](/back-to-batuk/funk/funk).", 
         src: '/music/rio1-cut22-funk.musicxml',
         images:['/images/2-2.png', '/images/funk.png'],
         showCircularView:false,
         surdo3: [
  { measure: 1, beat: 1 },
    { measure: 1, beat: 1.5 },

     { measure: 1, beat: 3 },
  { measure: 1, beat: 3.25 },

  { measure: 1, beat: 3.75 },
  { measure: 2, beat: 1 },
    { measure: 2, beat: 1.5 },

     { measure: 2, beat: 3 },
  { measure: 2, beat: 3.25 },

  { measure: 2, beat: 3.75 },
  


],
surdo1:[  { measure: 1, beat: 1 }, { measure: 1, beat: 3 },
  { measure: 2, beat: 1 }, { measure: 2, beat: 3 },

],
  
surdo2:[  { measure: 1, beat: 2 },
  { measure: 1, beat: 4 },
   { measure: 2, beat: 2 },
  { measure: 2, beat: 4 },
         

],

    timbaleVolume:2,
     sheetScale: 0.6,
     sideStickVelocityScale: 0.4,
kickVelocityScale: 2,  loop: false },



 { title: 'Rio 2', src: '/music/rio2.musicxml', images: ['/images/rio.png', '/images/2.png'], 
         circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },
], 
surdo1:[
    { measure: 1, beat: 1},

     { measure: 1, beat: 3 },
  { measure: 2, beat: 1 },
  { measure: 2, beat: 3 },

],
surdo2:[
    { measure: 1, beat: 2},

     { measure: 1, beat: 4},
  { measure: 2, beat: 2 },
  { measure: 2, beat: 4 },

],
 surdo3: [
    { measure: 1, beat: 1.5 },

     { measure: 1, beat: 3.5 },
  { measure: 2, beat: 1.5 },
  { measure: 2, beat: 2.5 },
  { measure: 2, beat: 3.25 },

  { measure: 2, beat: 3.75 },
],
kickVelocityScale: 2,sheetScale: 0.6, loop: true },
 { title: 'Rio 2 avec Blocage 1', description:"", 
         src: '/music/rio2-avec-blocage1.musicxml', images: ['/images/blocage1.png'],
        
surdo1:[
    { measure: 1, beat: 1},

     { measure: 1, beat: 3 },
  { measure: 2, beat: 1 },
  { measure: 2, beat: 3 },
      { measure: 3, beat: 2.5 },


],
surdo2:[
    { measure: 1, beat: 2},

     { measure: 1, beat: 4},
  { measure: 2, beat: 2 },
  { measure: 2, beat: 4 },
      { measure: 3, beat: 3 },


],
 surdo3: [
    { measure: 1, beat: 1.5 },

     { measure: 1, beat: 3.5 },
  { measure: 2, beat: 1.5 },
  { measure: 2, beat: 2.5 },
  { measure: 2, beat: 3.25 },

  { measure: 2, beat: 3.75 },
      { measure: 3, beat: 2.5 },

],

circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },

  { fromMeasure: 3, toMeasure: 3, repeats: 1 },],
    timbaleVolume:2,
     sheetScale: 0.6, 
kickVelocityScale: 2,  loop: true },
    ],
  },
  {
    id: 'funk',
    title: 'Funk',
    tracks: [
      { title: 'Funk', src: '/music/funk.musicxml', images: ['/images/funk.png'], kickVelocityScale: 2.5, sheetScale: 0.7, loop: true },
      { title: 'Funk avec 6',"description":"Pour les surdos même chose, pour les caisses on ajoute les 6 accents à la fin. ",kickVelocityScale: 2.5, src: '/music/funk-avec-6.musicxml',  images: ['images/6.jpeg'], sheetScale: 0.6, loop: true },
     // { title: 'Cut 2-2 dans Funk', src: '/music/2-2.musicxml', images: ['/images/2-2.png'],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
      { title: 'Funk + cut 2-2', src: '/music/funk-avec-6-et-cut22.musicxml',kickVelocityScale: 2.5,
         circularRhythm: [
  { fromMeasure: 1, toMeasure: 2, repeats: 1 },
  { fromMeasure: 3, toMeasure: 3, repeats: 1 },
],images: [ '/images/2-2.png'],  sheetScale: 0.6, loop: true },


    ],
  },

   {
    id: 'diablo',
    title: 'Diablo',
    tracks: [
      { title: 'Diablo 1', src: '/music/diablo1.musicxml', images: ['/images/diablo.png', '/images/1.png'],
         circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },
],
 kickVelocityScale: 2.5,   sideStickVelocityScale: 0.3,
 sheetScale: 0.7, loop: true },
      

      { title: 'Diablo 1 + Arrêt 5', src: '/music/diablo1-et-arret5.musicxml',  
         circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },
    { fromMeasure: 3, toMeasure: 4, repeats: 1 },

    //  { fromMeasure: 4, toMeasure: 4, repeats: 1 },

],
images: ['/images/arret5.png'], showCircularView: true,   kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },

 { title: 'Diablo 1 + Arrêt 5 retourné', src: '/music/diablo1-et-arret5-retourne.musicxml',
      circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },
    { fromMeasure: 3, toMeasure: 4, repeats: 1 },

    //  { fromMeasure: 4, toMeasure: 4, repeats: 1 },

],
  images: ['/images/arret5.png', '/images/retourne.png'], showCircularView: true,   kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },
{ title: 'Diablo 1 + Cut 3 "ternaire"', description: "Même idée que le cut ternaire dans le [rythme Ternaire](/back-to-batuk/ternaire/ternaire-cut3ternaire)", sheetDescription:"En vérité, dans le contexte de Diablo, c'est plutôt un rythme binaire + 2 temps à la fin", src: '/music/diablo1-avec-cut-ternaire.musicxml',  images: ['/images/cut.png', 'images/ternaireC.png'], showCircularView: false,   kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },
 {title: 'Diablo 1 + le truc avec la vague avec les mains', experimental:false, src: '/music/diablo1-avec-cut.musicxml',  images: [ '/images/diablo-vague.jpeg'], showCircularView: false,   kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },

//  { title: 'Diablo 1 + fade', experimental:true, src: '/music/diablo1-avec-fade.musicxml',  /*images: ['/images/diablo.png', '/images/1.png', '/images/jesaispas.png'],*/ showCircularView: false,   kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
// sheetScale: 0.6, loop: true },

 { title: 'Diablo 1 + "cut 4"', experimental:false, src: '/music/diablo1-avec-mechant.musicxml', 
    circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },
    { fromMeasure: 3, toMeasure: 3, repeats: 1 },

      { fromMeasure: 4, toMeasure: 4, repeats: 1 },

],
 images: ['/images/diablo-cut4.jpeg'], showCircularView: true,   kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },

 { title: 'Diablo 1 + "cut 4" et la main bouge de haut en bas', "description": "Même chose qu'avant + une mesure de silence",
    circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },
    { fromMeasure: 3, toMeasure: 3, repeats: 1 },

      { fromMeasure: 4, toMeasure: 4, repeats: 1 },
            { fromMeasure: 5, toMeasure: 5, repeats: 1 },


],
experimental:false, src: '/music/diablo1-avec-cut4-et-silence.musicxml',   images: ['/images/diablo-cut4-fleche.jpeg'],showCircularView: true, 
  kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },


 { title: 'Diablo 1 inversé', description:"Les caisses jouent la phrase de surdo, et inversement!", 
   circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },


],
src: '/music/diablo1-inverse.musicxml',  images: ['/images/diablo-inverse.jpeg'], showCircularView: true,
   kickVelocityScale: 2,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },

{ title: 'Diablo 2', src: '/music/diablo2.musicxml', images: ['/images/diablo.png', '/images/2.png'], 
        circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
    { fromMeasure: 2, toMeasure: 2, repeats: 1 },

    { fromMeasure: 3, toMeasure: 3, repeats: 1 },

  { fromMeasure: 4, toMeasure: 5, repeats: 1 },
], kickVelocityScale: 1.5,   sideStickVelocityScale: 0.3,
sheetScale: 0.6, loop: true },

      { title: 'Enchaînement Diablo 2 + Arrêt 5', src: '/music/diablo2-et-arret5.musicxml',  images: ['/images/arret5.png'], showCircularView: false, kickVelocityScale: 1.5,   sideStickVelocityScale: 0.4,
sheetScale: 0.6, loop: true },

    ],
  },
  
  {
    id: 'rock',
    title: 'Rock',
    tracks: [
      { title: 'Rockito', src: '/music/rockito.musicxml',  circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 2 },
  { fromMeasure: 3, toMeasure: 3, repeats: 2 },
  
], kickVelocityScale: 3,  images: ['/images/rockito.png'], sheetScale: 0.6, loop: true },
      { title: 'Rock 1', src: '/music/rock1.musicxml', circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 3 },
  { fromMeasure: 4, toMeasure: 4, repeats: 1 },
], images: ['/images/rock.png', '/images/1.png'], kickVelocityScale: 3,sheetScale: 0.6, loop: true },
      { title: 'Rock 2', src: '/music/rock2.musicxml', 
        description:"Pour les caisses, c’est le même rythme que Rock 1.",
        images: ['/images/rock.png', '/images/2.png'], kickVelocityScale: 3,sheetScale: 0.6, loop: true },


    ],
  },
  
  {
    id: 'clown',
    title: 'Clown',
    tracks: [
            { title: 'Intro de Clown',    images: ['/images/clown.png'], 
              
         surdo2: [
                     { measure: 12, beat: 1 },
                      { measure: 16, beat: 1 },




    { measure: 13, beat: 4 },
    

       { measure: 14, beat: 1 },



], surdo1: [
                     { measure: 11, beat: 1 },
                     { measure: 15, beat: 1 },


    { measure: 11, beat: 2.5 },
        { measure: 15, beat: 2.5 },


      { measure: 13, beat: 1 },


    { measure: 13, beat: 2.5 },



],
         surdo3: [
  { measure: 12, beat: 2.5 },
  { measure: 12, beat: 3 },

  { measure: 16, beat: 2.5 },
  { measure: 16, beat: 3 },
  { measure: 12, beat: 3.5 },
    { measure: 12, beat: 4 },

  { measure: 16, beat: 3.5 },
    { measure: 16, beat: 4 },
       { measure: 14, beat: 3 },
],
              src: '/music/intro-clown.musicxml',showCircularView: false,  kickVelocityScale: 2, sideStickVelocityScale: 0.5, sheetScale: 0.6, loop: false },

      { title: "Clown",description:"Le rythme de base, sans l'intro.", src: '/music/clown.musicxml', 
      
          surdo2: [
                     { measure: 2, beat: 1 },


    { measure: 3, beat: 4 },

       { measure: 4, beat: 1 },



], surdo1: [
                     { measure: 1, beat: 1 },


    { measure: 1, beat: 2.5 },

      { measure: 3, beat: 1 },


    { measure: 3, beat: 2.5 },



],
         surdo3: [
  { measure: 2, beat: 2.5 },
  { measure: 2, beat: 3 },
  { measure: 2, beat: 3.5 },
    { measure: 2, beat: 4 },
       { measure: 4, beat: 3 },
],
 circularRhythm: [
  { fromMeasure: 1, toMeasure: 2, repeats: 1 },
  { fromMeasure: 3, toMeasure: 4, repeats: 1 },
], kickVelocityScale: 2, sheetScale: 0.6, loop: true },
    ],
  },
  
  
  {
    id: 'ternaire',
    title: 'Ternaire',
    tracks: [
      { title: 'Ternaire', src: '/music/ternaire.musicxml',  circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 3 },
  { fromMeasure: 4, toMeasure: 4, repeats: 1 },
],  images: ['/images/ternaireA.png','/images/ternaireB.png' ],kickVelocityScale: 2, sideStickVelocityScale: 0.8, sheetScale: 0.6, compound: true, loop: true },
    //  { title: 'Cut 3 ternaire', src: '/music/cut3-ternaire.musicxml',  images: ['/images/cut.png','/images/ternaireC.png' ],kickVelocityScale: 2, sheetScale: 0.6, compound: true, loop: false },
      { title: 'Ternaire + cut 3 (ternaire)', src: '/music/ternaire+cut3ternaire.musicxml', circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 3 },
  { fromMeasure: 4, toMeasure: 4, repeats: 1 },
  { fromMeasure: 5, toMeasure: 5, repeats: 1 }], images: ['/images/cut.png','/images/ternaireC.png' ], sideStickVelocityScale: 0.8,kickVelocityScale: 2, sheetScale: 0.6, compound: true, loop: true },


    ],
  },
  {
    id: 'maracatu',
    title: 'Maracatu',
    tracks: [
      { title: 'Maracatu', src: '/music/maracatu.musicxml',  images: ['/images/maracatu.png'],kickVelocityScale: 2, sheetScale: 0.6, loop: true },
     // { title: 'Cut 2-2 dans Maracatu', src: '/music/2-2maracatu.musicxml', images: ['/images/2-2.png'],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
      { title: 'Maracatu + cut 2-2', "description":"Attention! C'est le même signe (et même nom) que le [cut2-2 pour Funk](/back-to-batuk/funk/funk-avec-6-et-cut22), mais c'est pas le même rythme (quoique similiaire...)!",  src: '/music/maracatu-avec-cut22.musicxml', 
         images: [ '/images/cut.png', '/images/2-2.png'],
        circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 }],
   kickVelocityScale: 2, sheetScale: 0.6, loop: true },
         //{ title: 'Cut rock', src: '/music/cut-rock-pour-maracatu.musicxml', images: [],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
                  { title: 'Maracatu + cut rock', src: '/music/maracatu-avec-cut-rock.musicxml',
                    circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 }],
   images: ['/images/cut.png', '/images/rock.png'],  kickVelocityScale: 2, sheetScale: 0.6, loop: true },
       //              { title: 'Cut 4', src: '/music/cut4-pour-maracatu.musicxml', images: [],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
                  { title:'Maracatu + cut 4', src: '/music/maracatu-avec-cut4.musicxml', 
                    circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 }], images: ['/images/cut.png', '/images/diablo-cut4.jpeg'],  kickVelocityScale: 2, sheetScale: 0.6, loop: true },
         //          { title: 'Cut 7', src: '/music/cut7-pour-maracatu.musicxml', images: [],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
                  { title: 'Maracatu + cut 7', src: '/music/maracatu-avec-cut7.musicxml', 
                    circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 }],
   images: [ '/images/cut.png', '/images/7.png'], kickVelocityScale: 2, sheetScale: 0.6, loop: true },
       //             { title: 'Cut 10', src: '/music/cut10-pour-maracatu.musicxml', images: [],  kickVelocityScale: 1, sheetScale: 0.6, loop: false },
                  { title: 'Maracatu + cut 10', src: '/music/maracatu-avec-cut10.musicxml',
                    circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 }],
    images: ['/images/cut.png',  '/images/10.png'],  kickVelocityScale: 2, sheetScale: 0.6, loop: true },




    ],
  },
  {
    id: 'riboy',
    title: 'Riboy',
    tracks: [
      { title: 'Riboy', src: '/music/riboy.musicxml', circularRhythm: [
        { fromMeasure: 1, toMeasure: 1, fromBeat: 1, toBeat: 2, repeats: 3 },
        { fromMeasure: 2, toMeasure: 2, fromBeat: 3, toBeat: 4, repeats: 1 },
      ], images: ['/images/riboy.png'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

    ],
  },
  {
    id: 'indiens',
    title: 'Indiens',
    tracks: [
      { title: 'Indiens', src: '/music/indiens.musicxml',  images: ['/images/indiens.png'],
        
         circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 }], kickVelocityScale: 2.5, sheetScale: 0.6, loop: true },
  { title: 'Indiens avec blocage 1', src: '/music/indiens-avec-blocage1.musicxml',  images: ['/images/indiens.png', '/images/blocage1.png'],
        
         circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 }],
  surdo1: [{ measure: 3, beat: 2.5 }], surdo3: [{ measure: 3, beat: 2.5 }],
          surdo2: [{ measure: 3, beat: 3 }],
  kickVelocityScale: 1.5, sheetScale: 0.6, loop: true },
        { title: 'Anges (en cours)', src: '', images: ['images/anges.png'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

      { title: 'Cowboys (en cours)', src: '',  images: [],
   kickVelocityScale: 3, sheetScale: 0.6, loop: true },

    ],
  },
  {
    id: 'dogfight',
    title: 'Dog fight',
    tracks: [
            { title: 'Dog fight (en cours)', src: '/music/dogfight.musicxml', images: ['images/cutedog.jpg'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

    ],
  },
  {
    id: 'baile-funk',
    title: 'Baile funk',
    tracks: [
            { title: 'Baile funk 1', src: '/music/baile-funk-1.musicxml',
              
circularRhythm: [
  { fromMeasure: 1, toMeasure: 2, repeats: 1 },
  { fromMeasure: 3, toMeasure: 4, repeats: 1 },
],
   images: ['images/bailey-funk.jpeg',  '/images/1.png'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },
            { title: 'Baile funk 1 + cut 13',"description":"cut '13' parce qu'on joue ensemble 13 coups (si on oublie les 4 plus rapides à la fin...)", 
                     
circularRhythm: [
  { fromMeasure: 1, toMeasure: 2, repeats: 1 },
  { fromMeasure: 3, toMeasure: 4, repeats: 1 },
    { fromMeasure: 5, toMeasure: 6, repeats: 1 },

],src: '/music/baile-funk-1-avec-13.musicxml', images: ['/images/13.jpeg'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },

            { title: 'Baile funk 2', src: '/music/baile-funk-2.musicxml', 
              circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 3 },
  { fromMeasure: 4, toMeasure: 4, repeats: 1 },

],
images: ['images/bailey-funk.jpeg', '/images/2.png'], kickVelocityScale: 3,sideStickVelocityScale: 0.5, sheetScale: 0.6, loop: true },
            { title: 'Baile funk 2 + cut 13', src: '/music/baile-funk-2-avec-13.musicxml', 
              circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 3 },
  { fromMeasure: 4, toMeasure: 4, repeats: 1 },
    { fromMeasure: 5, toMeasure: 6, repeats: 1 },


],
images: ['/images/13.jpeg'], kickVelocityScale: 3, sideStickVelocityScale: 0.5, sheetScale: 0.6, loop: true },

           // { title: '13 (en cours)', src: '/music/13.musicxml', images: ['images/13.jpeg'], kickVelocityScale: 3, sheetScale: 0.6, loop: false },



    ],
  },

  {
    id: 'samba-reggae',
    title: 'Samba Reggae',
    tracks: [
            { title: 'Samba Reggae', src: '/music/samba-reggae.musicxml', images: ['images/samba-reggae.jpeg'], kickVelocityScale: 3, sheetScale: 0.6, loop: true },
            


    ],
  },
  {
    id: 'depart-rapide',
    title: 'Départ rapide',
    tracks: [
      { title: 'Départ rapide', src: '/music/depart-rapide.musicxml',
         images: ['/images/depart-rapide.jpg' ], 
         circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 1 },
  { fromMeasure: 2, toMeasure: 2, repeats: 1 },
  { fromMeasure: 3, toMeasure: 3, repeats: 1 },
  { fromMeasure: 4, toMeasure: 4, repeats: 1 }], showCircularView: false, kickVelocityScale: 3, sheetScale: 0.6, loop: false },
    ],
  },
   {
    id: 'cut-arret',
    title: 'Cut et arrêt',
    description:"Un nouveau cut (shuffle) + quelques cuts/arrêts qu'on a vu dans les autres sections, isolément.",
    tracks: [
      { title: 'Cut shuffle', src: '/music/cut-shuffle.musicxml',  images: ['/images/shuffle.png'],
          circularRhythm: [
  { fromMeasure: 1, toMeasure: 1, repeats: 3 },
  { fromMeasure: 4, toMeasure: 4, repeats: 1 }],
   kickVelocityScale: 3, sheetScale: 0.6, loop: false },
      { title: 'Blocage 1', src: '/music/blocage1.musicxml', images: ['/images/blocage1.png'], kickVelocityScale: 1,
        surdo1: [{ measure: 1, beat: 2.5 }], surdo3: [{ measure: 1, beat: 2.5 }],
          surdo2: [{ measure: 1, beat: 3 }], sheetScale: 0.6, loop: false },
  { title: 'Arrêt 5', src: '/music/arret5.musicxml',  images: ['/images/arret5.png'], kickVelocityScale: 1.5, sideStickVelocityScale: 0.6, sheetScale: 0.6, loop: false },
    { title: 'Arrêt 5 retourné', src: '/music/arret5-retourne.musicxml',  images: ['/images/arret5.png', '/images/retourne.png'], sideStickVelocityScale: 0.6, kickVelocityScale: 1.5, sheetScale: 0.6, loop: false },

      { title: 'Cut 3 normal', src: '/music/cut3-normal.musicxml',  images: ['/images/cut.png','/images/3.png' ], kickVelocityScale: 1, sheetScale: 0.6, loop: false },
      

    ],
  },
]
