// vim-tales story: chapters, maps and monsters, in English and Spanish. Each level id from engine.ts gets a sage + a gate monster.
// Map legend:  # wall  ^ rock  ~ water  H house   (blocked)
//              ' ' grass  . path/island  = stepping-stone  (walkable; '=' counts as a word for w/b/e)
//              o  island (walkable, blank for w/b/e: reach it with fo / Fo / ;)
//              $ treasure  ♥ heart  + key  | door (needs a key)  > exit  @ start
//              & villager   a-e sage teaching chapter.levels[i]   A-E monster guarding that level's battle
//              L  lore keeper: tells chapter.lore[i] (i = reading order) and adds it to the :lore journal
//              M / W  roaming monster patrolling horizontally / vertically
// Sprite names (spr, wall, roamer) come from sprites.ts.
import type { SpellId } from './engine.ts';
import type { Ground } from './sprites.ts';
// text in both languages: [english, spanish]
export type Tx = [en: string, es: string];
// a story line: [sprite, speaker, text]. sprite 'hero' speaks with the player's name, '' is the narrator
export type Line = [spr: string, who: Tx | '', text: Tx];
export interface Person { spr: string; name: Tx; say: Tx[] }
// a page of Textoria's history: collected once per save, read back with :lore (later: trivia, weapon unlocks)
export interface Lore { spr: string; name: Tx; title: Tx; fact: Tx }
export interface Chapter {
  name: Tx; ground: Ground; wall: string; roamer: string;
  intro: Line[]; map: string[]; levels: SpellId[]; sages: Person[]; npcs: Person[]; lore: Lore[];
}
export interface Monster { spr: string; name: Tx; taunt: Tx }

const MAPS: string[][] = [
  [
    '################################################################################',
    '#H  &   #     $#    M         #    $   # L #      #    $#        #         $   #',
    '#  @ a  #  ##  #  ####  ####  #  ###   #   #  ##  #  ####  ####  #  ######  ## #',
    '#       #  #   #     #     #  #    #          ##        #     #     #    #     #',
    '#  ###     #####  #  #  #  #     #  +  #####  #   ###   #  #  #  #####  #  #   #',
    '#  #$#  M         #     #  ####  #     ##     #     #      #     #   M  #  ### #',
    '#       ####  &   #######        #|##  ##  $  ####  #  M   ####  #   ####    $ #',
    '#H  $      #           M         #$ #  ##          #           ♥#              #',
    '############################################################################A###',
    '#  L  &  ~~~~~~~~~~~~~~~~~~~~          #      ~~~~~~~~~~~~~~~~~~~~~~~~~~~ b    #',
    '#        ~~~~~~~~~~~~~~~~~~~~          #      =~~~=~~~~=~~~$~~~=~~~=~~~~=      #',
    '#   ♥    ==~~~~~$~~~~==~~~~~~          #      ~~~~~~~~~~~~~~~~~~~~~~~~~~~  $   #',
    '#        ~~~~~~~~~~~~~~~~~~~~    $            ==~~==~~~==~~~~~=~~~==~~~==      #',
    '#   M    ==~~==~~~=~~~===~~==          #      ~~~~~~~~~~~~~~~~~~~~~~~~~~~      #',
    '#        ~~~~~~~~~~~~~~~~~~~~          #   $  =~~~=~~~=~~$=~~~=~~~=~~~==~  ♥   #',
    '#  $     =~~~=~~~~~~~=~~~~~$~          #      ~~~~~~~~~~~~~~~~~~~~~~~~~~~      #',
    '##############################B#################################################',
    '#     c                                                               $         ',
    '##############################################################################  ',
    '   M        $          M         M            $        M           M      $     ',
    '  ##############################################################################',
    '        $      M             M     $         M         $      M          M      ',
    '##############################################################################  ',
    '  $  M          M        M                  M        $         M      M         ',
    '  ##############################################################################',
    '   $        M          M                      M      $        M        M   $    ',
    '###############################################################################C',
    '  $                 >                                 $                $        ',
  ],
  [
    '$#######################################################################',
    '  $#####################################################################',
    '########################################################################',
    '#@  a       #           #     &    #  $               M               L#',
    '#           #   ####    #          #                                   #',
    '#     M         #  #  M #  ######  ################################    #',
    '#  ######       # $#    #  #       #                    M              #',
    '#  #         #  #  #       #  $    #         M                       $ #',
    '#  #   M     #  #  #    W  ######  #   #################################',
    '#  ######    #                                  M                      #',
    '#            #  M       #     W    #                                 $ #',
    '   .   &     #          #          #                      M       ♥    #',
    '######################################################################A#',
    '#                         &                                         b  #',
    '#~~~o~~~~~~~~o~~~~~~~~~~~~~$~~~~~~~#~~~~o~~~~~~~~~o~~~~~~~~~~$~~~~o~~~~#',
    '#~~~~~~~~~~~~o~~~~~$~~~~~o~~~~~~~~~#~~~~~~~~~~~~~~o~~~~~~~~~~~~~~~o~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~o~~~~~~~~~#~~~~~~~~~~~~~~~~~~~~$~~~~~~~~~o~~~~#',
    '#~~~~~~~o~~~~~~~~~~~~~~~~L~~~~~~$~~#~~~~~~~~o~~~~~~~~~~~~~~~~~~~~~o~~~~#',
    '#~~~~~~~o~~~~~~~~~~~~~~~~~~~~~~~~~~#~~~~~~~~o~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~o~~~~~~~~~~~~~~~~~~~~~~~~~~#~~~$~~~~o~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#       #                          #########B###########################',
    '#  $                        >                 $             $          #',
    '########################################################################',
  ],
  [
    '########################################################################',
    '#@  a   ~~~~   #      M        $   #    #         ~~~~        $        #',
    '#       ~~~~   #   ######   ####   #    #         ~~~~    #####        #',
    '#  &    ~~==== #   #    #   #  #   #    #    +    ~~~~    #            #',
    '#       ~~~~   #   # $  #   #+ #   #    #         ~~~~    | $          #',
    '#####   ~~~~       #    #                         =~~=    #            #',
    '#   #          M   ###  #####  ### #    #         ~~~~    #####        #',
    '# $ |      ~~~~~~           & #$#  #    #    M    ~~~~             $   #',
    '#   #      ~~~~~~      M      # #  #    #         ~~~~                 #',
    '####################################################################A###',
    '#  b             &                                                     #',
    '#~~~~o~~~~~~==~~~~~~=~~~~~~$~~~~~~~#~~~~~~=~~~~~~~~~~~~~~~~~~~=~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~=~~~~~~~~~~~~~~#~~~~~~=~~~~~~~~~~~~~~~~~~~=~~~~~~~~#',
    '#~~~~~~~o~~~~~~~~~~~=~~~~~~~==~~~~~#~~~~~~=~~~~~~~$~~~~~~~~~~~=~~~~~~~~#',
    '#~~~~~~~o~~~~~~~~~~~~~~~~~~~~=~~~~~#~~~~~~=~~~~~~~~~~~~~~~~~~~=~~~~~~~~#',
    '#~~~~~~~o~~~~~~$~~~~~~~~~~~~~=~~~~~#~~~~~~=~~~~~~~~~~~~~~~~~~~=~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~=~~~~~#~~~~~~=~~~~~~~~~~~~~~~~~~~=~~~~~~~~#',
    '#L          ♥                   &  #######$################### #########',
    '##############################################################B#########',
    '#  c                                            $                      #',
    '################ #######################################################',
    '#    $   M          M         $             M          $        M     L#',
    '################ #######################################################',
    '#  M         M              M   +        M          M             $    #',
    '################ #######################################################',
    '# $     M         M          M   $            M          $     M       #',
    '################C#######################################################',
    '#$$|                              >#####################################',
    '########################################################################',
  ],
  [
    '####################################################################',
    '#@ a    ^^^^    W        ^^^  $  #     ^^^        ^       $   ^^   #',
    '#       ^  ^         ^^       ^^            ^^^^      ^            #',
    '####    ^$ ^   ^^^^  ^^  M       #  ^     W     ^^          ^^^    #',
    '#  ^    ^^ ^      ^       ^^^^   #    ^^^^          $   ^          #',
    '#  $       ^  &   ^   ^      ^   #            ^^^             M    #',
    '#  ^^^^^^^^^      ^^^^^      ^ $ #  $   ^            ^^^^       ^  #',
    '#        M           W       ^   #          ^   M                  #',
    '#   ♥          ^^^          $^   #      ^^                $    ^   #',
    '################################################################A###',
    '#  b         &                                                     #',
    '#~~~~~~~o~~~~~~~~~~~~~==~~~~~~~~~#~~~~o~~~~~~~~~~~==~~~~~~~~~~o~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~=~~~~~~~$~#~~~~o~~~~~~~$~~~~=~~~~~~~~~~o~~~~#',
    '#~~~o~~~~~~~~~~~~~~~~~~=~~~~~~~~~#~~~~~~~~~~~~~~~~~=~~~~~~~~~~o~~~~#',
    '#~~~o~~~~~$~~~~~~~~~~~~~~~~~~~~~~#~~~~~~~~~~o~~~~~~~~~~~$~~~~~o~~~~#',
    '#~~~L~~~~~~~~~~~~~~~~~~~~~~~~~~~~#~~~~~~~~~~o~~~~~~~~~~~~~~~~~o~~~~#',
    '#   #                                       B#######################',
    '###########c################  ######################################',
    '#=  M      $      M        M            M       $      M         =L#',
    '# ##################################################################',
    '# $   M         M        M   =        $      M            M      $ #',
    '#############################C######################################',
    '#  $  >                                       $              ♥     #',
    '####################################################################',
  ],
  [
    '############################################################',
    '#       $  #  (^^^^^^^^)         ♥  [~~~~~~~~]# L          #',
    '# @ a      #  (^^^^^^^^)            [~~~~~~~~]#$    $      #',
    '#          #  (^^^^^^^^)    M       [~~~~~~~~]#####        #',
    '#             (^^^^^^^^)            [~~~~~~~~]             #',
    '#             (^^^^^^^^)            [~~~~~~~~]             #',
    '#  &       #  (^^^^^^^^)            [~~~~~~~~]   M         #',
    '#          #  (^^^^^^^^) $          [~~~~~~~~]             #',
    '#          #  (^^^^^^^^)            [~~~~~~~~]          +  #',
    '########################################################A###',
    '#         {~~~~~~}      {^^^^^^}        [~~~~~]     b      #',
    '# ######  {~~~~~~}      {^^^^^^} $      [~~~~~]            #',
    '# #$  |   {~~~~~~}      {^^^^^^}        [~~~~~]        &   #',
    '########  {~~~~~~}      {^^^^^^}        [~~~~~]            #',
    '##L#      {~~~~~~}      {^^^^^^}        [~~~~~]   M        #',
    '## #      {~~~~~~} M    {^^^^^^}        [~~~~~]            #',
    '#   ♥     {~~~~~~}      {^^^^^^}        [~~~~~]            #',
    '#         {~~~~~~}      {^^^^^^}        [~~~~~]          $ #',
    '###B########################################################',
    '#        $          M                       M              #',
    '#             (~~~~)              {^^^^}                 > #',
    '#                           $                     $        #',
    '############################################################',
  ],
  [
    '############################################################',
    '# H           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        $      #',
    '# @ a         ~~~~o~~~~~~~~o~~~~$~~~~o~~~~~o               #',
    '#  &          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~      M        #',
    '#             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~               #',
    '#             ~~~~~~~~~~~L~~~~~~~~~~~~~~~~~~  M            #',
    '#     ♥       o~~~~~~~~~~o~~~~~~~~~~~~~~~~~            $   #',
    '#             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~               #',
    '#########################################################A##',
    '#   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   #',
    '#   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~b  #',
    '#   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   #',
    '#$  ==~~==~~~===~~=~~~==~~~=~~$==~~=~~~~=~~==~~~=~~~==~=   #',
    '#   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~L~~~~~~~~~~~~~~~ & #',
    '#   o~~~~~~~~~~~~~~~o~~~~~~~~~~~~~~~~~~~o~~~~~~~~~~~~~~~   #',
    '#♥  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   #',
    '##B#########################################################',
    '#  c                M                   $                  #',
    '#^^^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^    ^^^^^^^    #',
    '#           M                 ♥             M              #',
    '#     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^    ^^^^^^^^^^^^^^     #',
    '# $                      M                             $   #',
    '#########################################################C##',
    '# $                           >                   $        #',
    '############################################################',
  ],
  [
    '############################################################',
    '#     ^^^^^             $    #      ^^^           $        #',
    '#  D  ^^^^^      d                        M               L#',
    '#     M          M           #      ^^^                ♥   #',
    '########################### ################################',
    '#     W           W          #        W           W        #',
    '#         ^^^   $   ^^^           ^^^       $       ^^^    #',
    '#  $        W           W    #                          $  #',
    '######################################################C#####',
    '#   ~~~L~~~~~~~~~~~~~~       #~~~~~~~~~~~~~~~~~~~~~~~~o~~~~#',
    '#   o~~o~~~~~o~~~~~o~~  c     ~~~o~~~~~o~~~~~~$~~~~~~~o~~~~#',
    '#   ~~~~~~~~~$~~~~~~~~       #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '##########################B#################################',
    '#      ~~~~~~~~~~~      $    #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#  b   ~~=~~==~~~=   M        =~~=~~~=~~$=~~~=~~=~~~~=     #',
    '#   ♥  ~~~~~~~~~~~           #~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~#',
    '#########################################################A##',
    '#   $        M                        M               $    #',
    '#   ^^^^^^^^^^^^^^^^^^^^^    #  ^^^^^^^^^^^^^^^^^^^^^^     #',
    '#@  a      M          $      #    $         M              #',
    '############################################################',
  ],
];

const CHAPTERS: Chapter[] = [
  {
    name: ['Chapter I — Hjkl Village', 'Capítulo I — Aldea Hjkl'], ground: { kind: 'grass', ramp: ['#2f5d2a', '#3f7a34', '#5a9a40', '#8cc152'], flowers: true }, wall: 'pine', roamer: 'rat',
    intro: [
      ['', '', ['THE YEAR IS 198X. In the 8-bit kingdom of TEXTORIA, every word was typed by hand on glowing green screens.',
        'CORRE EL AÑO 198X. En el reino de 8 bits de TEXTORIA, cada palabra se escribía a mano en brillantes pantallas verdes.']],
      ['', '', ['Then DR. CLICKER crawled out of his MOUSE LAB. One double-click, and the ARROW CURSE fell: hands fled the home row and the words began to rot.',
        'Entonces el DR. CLICKER salió de su LABORATORIO DEL RATÓN. Un doble clic, y cayó la MALDICIÓN DE LAS FLECHAS: las manos huyeron de la fila guía y las palabras empezaron a pudrirse.']],
      ['', '', ['Only one cursor still blinks in Hjkl Village. Its name is PROMPT. PRESS START... I mean, Enter.',
        'Solo un cursor sigue parpadeando en la Aldea Hjkl. Se llama PROMPT. PULSA START... digo, Enter.']],
      ['elder', ['Elder Hjkl', 'Anciano Hjkl'], ['PROMPT, over here! We ELDERS are the sages of Textoria, and we still remember the old keys. Each of us guards one command.',
        '¡PROMPT, aquí! Los ANCIANOS somos los sabios de Textoria y aún recordamos las viejas teclas. Cada uno de nosotros guarda un comando.']],
      ['elder', ['Elder Hjkl', 'Anciano Hjkl'], ['Walk into a sage and they will teach you a new command. That command is the weakness of the monster guarding the road ahead: no lesson, no victory.',
        'Camina hacia un sabio y te enseñará un comando nuevo. Ese comando es la debilidad del monstruo que vigila el camino: sin lección, no hay victoria.']],
      ['hero', '', ['Find a sage, learn the command, beat the monster, repeat. Rats roam the village and attack if they touch me. Ctrl-o takes me back to the last sage. First stop: Elder Hjkl!',
        'Buscar un sabio, aprender el comando, vencer al monstruo, repetir. Las ratas recorren la aldea y atacan si me tocan. Ctrl-o me lleva al último sabio. Primera parada: ¡el Anciano Hjkl!']],
      ['', '', ['TIP: type : for the command line. :help lists every command and setting, :quest tells you where to go.',
        'CONSEJO: escribe : para la línea de comandos. :help muestra comandos y ajustes, :quest te dice adónde ir.']],
    ],
    map: MAPS[0],
    levels: ['hjkl', 'words', 'edges'],
    sages: [
      { spr: 'elder', name: ['Elder Hjkl', 'Anciano Hjkl'], say: [
        ['It\'s dangerous to click alone! Take this: h j k l to move, i to write, Esc to stop writing. A true hero never leaves the home row.', '¡Es peligroso hacer clic solo! Toma esto: h j k l para moverte, i para escribir, Esc para dejar de escribir. Un verdadero héroe nunca abandona la fila guía.'],
        ['Remember the two modes. NORMAL mode moves you, INSERT mode types. The word at the bottom of the screen tells you where you are.', 'Recuerda los dos modos. El modo NORMAL te mueve, el modo INSERTAR escribe. La palabra al pie de la pantalla te dice dónde estás.'],
        ['The Arrow Rat guards the river road and nibbles letters out of words. Walk to each gap, press i, type the letter back, then Esc.', 'La Rata Flecha vigila el camino del río y roe letras de las palabras. Camina a cada hueco, pulsa i, escribe la letra y luego Esc.'],
      ] },
      { spr: 'wanderer', name: ['Wanderer Wen', 'Viajero Wen'], say: [
        ['That river can\'t be walked. But see the stepping-stones? Each one is a WORD.', 'Ese río no se puede caminar. ¿Ves las piedras? Cada una es una PALABRA.'],
        ['Stand on the bank and leap from word to word. The water is just blank space.', 'Párate en la orilla y salta de palabra en palabra. El agua es solo espacio en blanco.'],
      ] },
      { spr: 'margin', name: ['Old Margin', 'Vieja Margen'], say: [
        ['Below are the rat tunnels: long lines full of vermin.', 'Abajo están los túneles de ratas: líneas largas llenas de alimañas.'],
        ['Don\'t walk them. Leap to the very edge with 0 or $, and the rats in between can\'t touch you.', 'No los camines. Salta al borde con 0 o $, y las ratas de en medio no podrán tocarte.'],
        ['I hid at the far end of the last tunnel. Leap there and look down.', 'Me escondí al final del último túnel. Salta hasta allí y mira hacia abajo.'],
      ] },
    ],
    npcs: [
      { spr: 'mom', name: ['Mom', 'Mamá'], say: [
        ['PROMPT! Dr. Clicker\'s rats chewed through the village. Take care out there, honey.', '¡PROMPT! Las ratas del Dr. Clicker royeron toda la aldea. Cuídate ahí fuera, cariño.'],
        ['Press Enter or Space to keep talking. And grab the treasure in the houses. Nobody will mind.', 'Pulsa Enter o Espacio para seguir hablando. Y toma el tesoro de las casas. A nadie le importará.'],
      ] },
      { spr: 'farmer', name: ['Farmer', 'Granjero'], say: [
        ['There\'s a locked shed by the east fence. I lost the key near the old well.', 'Hay un cobertizo cerrado junto a la cerca del este. Perdí la llave cerca del viejo pozo.'],
        ['A key opens one door. Walk into the door with a key and it opens.', 'Una llave abre una puerta. Camina hacia la puerta con una llave y se abrirá.'],
      ] },
      { spr: 'fisher', name: ['Fisher', 'Pescador'], say: [
        ['I used to fish with a mouse. Now I just... click at the water. Nothing bites.', 'Antes pescaba con un ratón. Ahora solo... hago clic en el agua. Nada pica.'],
        ['Some stones lead nowhere. Stuck out there? Leap back with b.', 'Algunas piedras no llevan a ninguna parte. ¿Atascado? Salta atrás con b.'],
      ] },
    ],
    lore: [
      { spr: 'keeper', name: ['Archivist Ada', 'Archivista Ada'], title: ['The First Word', 'La primera palabra'], fact: ['Textoria began as one blinking cursor on an empty line. The first word ever typed here was \'hello\', and every village since was written by hand, letter by letter.', 'Textoria empezó como un cursor parpadeando en una línea vacía. La primera palabra que se escribió aquí fue \'hello\', y desde entonces cada aldea se escribió a mano, letra a letra.'] },
      { spr: 'bard', name: ['Bard Kay', 'Bardo Kay'], title: ['The Home Row Oath', 'El juramento de la fila guía'], fact: ['The ELDERS swore an oath on the home row: a s d f, j k l ;. While one hand rests there, the words cannot rot. Dr. Clicker has hated that row ever since.', 'Los ANCIANOS juraron sobre la fila guía: a s d f, j k l ñ. Mientras una mano descanse ahí, las palabras no se pudren. El Dr. Clicker odia esa fila desde entonces.'] },
    ],
  },
  {
    name: ['Chapter II — The Counting Fields', 'Capítulo II — Los Campos Contados'], ground: { kind: 'grass', ramp: ['#6a6526', '#8c8634', '#ada646', '#dcd06c'], flowers: true }, wall: 'oak', roamer: 'boar',
    intro: [
      ['', '', ['STAGE 2. Golden 8-bit fields stretch east. Wild boars charge down every path.', 'NIVEL 2. Campos dorados de 8 bits se extienden al este. Jabalíes salvajes cargan por cada sendero.']],
      ['hero', '', ['The boars move each time I act... if I cover many steps in ONE command, they\'ll never catch me.', 'Los jabalíes se mueven cada vez que actúo... si recorro muchos pasos en UN comando, nunca me atraparán.']],
    ],
    map: MAPS[1],
    levels: ['counts', 'find'],
    sages: [
      { spr: 'nine', name: ['Farmer Nine', 'Granjero Nueve'], say: [
        ['Took you long enough. Out here we count everything, even our steps.', 'Cuánto tardaste. Aquí contamos todo, hasta nuestros pasos.'],
        ['See the numbers down the left side of the world? LINE numbers. They matter.', '¿Ves los números en el borde izquierdo del mundo? Números de LÍNEA. Importan.'],
        ['Rumor says treasure is buried on line 1 and line 2, sealed where no foot can walk...', 'Dicen que hay un tesoro enterrado en la línea 1 y la 2, sellado donde ningún pie puede llegar...'],
      ] },
      { spr: 'seeker', name: ['Seeker Fen', 'Buscadora Fen'], say: [
        ['You can\'t see me unless you know what to look for. The lake is the same.', 'No puedes verme si no sabes qué buscar. El lago es igual.'],
        ['Those islands ( o ) are too far to walk or leap as words. But you can FIND them.', 'Esas islas ( o ) están demasiado lejos para caminar o saltar como palabras. Pero puedes ENCONTRARLAS.'],
      ] },
    ],
    npcs: [
      { spr: 'shepherd', name: ['Shepherd', 'Pastor'], say: [
        ['I lost 27 sheep. Then I typed 27j and found them all at once!', 'Perdí 27 ovejas. ¡Luego escribí 27j y las encontré todas de golpe!'],
        ['Lost in a sealed pocket? Line 12 begins with a path tile. Just saying.', '¿Atrapado en un rincón sellado? La línea 12 empieza con un camino. Solo digo.'],
      ] },
      { spr: 'girl', name: ['Girl', 'Niña'], say: [
        ['The boar near the barn charges back and forth. Dash past in one go and it can\'t react!', 'El jabalí del granero va y viene. ¡Pasa de un solo salto y no podrá reaccionar!'],
      ] },
      { spr: 'ferry', name: ['Ferryman', 'Barquero'], say: [
        ['My boat sank in the curse. Islands everywhere and nothing to row with.', 'Mi barca se hundió con la maldición. Islas por todas partes y nada con qué remar.'],
        ['Remember: ; repeats your last find. Island to island to island.', 'Recuerda: ; repite tu última búsqueda. De isla en isla en isla.'],
      ] },
    ],
    lore: [
      { spr: 'keeper', name: ['Hermit Ten', 'Ermitaño Diez'], title: ['Fields of Lines', 'Campos de líneas'], fact: ['Farmers here count fields in lines, not acres. Line 1 belonged to King Bram himself, which is why the oldest treasure is buried up there.', 'Aquí los granjeros cuentan los campos en líneas, no en hectáreas. La línea 1 era del propio Rey Bram; por eso el tesoro más antiguo está enterrado allí arriba.'] },
      { spr: 'bard', name: ['Drover Pia', 'Arriera Pía'], title: ['Clive the Scribe', 'Clive el escriba'], fact: ['Dr. Clicker was once a royal scribe named Clive. He grew tired of typing and built a little machine with a single button. He called it the MOUSE.', 'El Dr. Clicker fue una vez un escriba real llamado Clive. Se cansó de escribir y construyó una maquinita con un solo botón. La llamó el RATÓN.'] },
    ],
  },
  {
    name: ['Chapter III — Typo Swamp', 'Capítulo III — Pantano Errata'], ground: { kind: 'grass', ramp: ['#22392b', '#2e4d38', '#41684a', '#6a9460'], water: ['#16302c', '#21473f', '#376a5c', '#86b8a4'] }, wall: 'reed', roamer: 'mosquito',
    intro: [
      ['', '', ['STAGE 3. A swamp where words go to rot. Dr. Clicker\'s mouse-drag smeared every letter, and typos crawl from the mud.',
        'NIVEL 3. Un pantano donde las palabras se pudren. El arrastre del ratón del Dr. Clicker emborronó cada letra, y las erratas salen del lodo.']],
      ['hero', '', ['Moving isn\'t enough here. I must learn to EDIT the world... and dodge those mosquitoes.', 'Aquí moverse no basta. Debo aprender a EDITAR el mundo... y esquivar esos mosquitos.']],
    ],
    map: MAPS[2],
    levels: ['x', 'insert', 'lines'],
    sages: [
      { spr: 'fairy', name: ['Fairy Xie', 'Hada Xie'], say: [
        ['Shh! The Typo Toad feeds on extra letters. Take them away and he starves.', '¡Shh! El Sapo Errata se alimenta de letras de más. Quítaselas y morirá de hambre.'],
        ['Until now you typed missing letters in. Here you take extra ones out, and every letter you fix hurts the monster.', 'Hasta ahora escribías las letras que faltaban. Aquí quitas las que sobran, y cada letra que arregles daña al monstruo.'],
      ] },
      { spr: 'djinn', name: ['Djinn Insertus', 'Genio Insertus'], say: [
        ['To speak into the world you must enter INSERT mode...', 'Para hablarle al mundo debes entrar en modo INSERTAR...'],
        ['...and always, ALWAYS return to NORMAL mode with Esc. Those who forget are lost in the swamp forever.', '...y siempre, SIEMPRE volver al modo NORMAL con Esc. Quien lo olvida se pierde en el pantano para siempre.'],
      ] },
      { spr: 'mer', name: ['Mer Ao', 'Sirena Ao'], say: [
        ['Below lie the mosquito halls. Three corridors cross the only way down.', 'Abajo están los salones de mosquitos. Tres pasillos cruzan el único camino.'],
        ['Walk step by step and they\'ll bite. Count and dash: 6j and you\'re through before they blink.', 'Camina paso a paso y te picarán. Cuenta y corre: 6j y pasarás antes de que parpadeen.'],
      ] },
    ],
    npcs: [
      { spr: 'toad', name: ['Frog', 'Rana'], say: [['Ribbit. Thhe... I mean, The. The toad cursed my spelling!', 'Croac. Eel... digo, El. ¡El sapo maldijo mi ortografía!']] },
      { spr: 'scribe', name: ['Old Scribe', 'Viejo Escriba'], say: [
        ['See that treasure walled in by reeds? You can\'t walk there... but you could FIND it.', '¿Ves ese tesoro rodeado de juncos? No puedes caminar hasta allí... pero podrías ENCONTRARLO.'],
        ['To get back out, find a spot you CAN stand on. t stops one step before.', 'Para salir, busca un lugar donde SÍ puedas estar. t se detiene un paso antes.'],
      ] },
      { spr: 'kid', name: ['Rowboat Kid', 'Niño del Bote'], say: [['The stones across the swamp go down, not across. Hop, then look below you.', 'Las piedras del pantano bajan, no cruzan. Salta y luego mira debajo de ti.']] },
      { spr: 'wizard', name: ['Lost Wizard', 'Mago Perdido'], say: [
        ['There\'s a vault near the exit with two chests. Doors need keys, keys are in the swamp.', 'Hay una cámara cerca de la salida con dos cofres. Las puertas necesitan llaves, y las llaves están en el pantano.'],
        ['Every second I stay in insert mode I forget a spell. Esc! Esc! Esc!', 'Cada segundo en modo insertar olvido un hechizo. ¡Esc! ¡Esc! ¡Esc!'],
      ] },
    ],
    lore: [
      { spr: 'keeper', name: ['Swamp Scribe Oz', 'Escriba Oz'], title: ['The First Typo', 'La primera errata'], fact: ['Clive dragged a word across this swamp with his mouse and smeared it. That smudge was the first typo, and the toads have fed on it ever since.', 'Clive arrastró una palabra por este pantano con su ratón y la emborronó. Ese borrón fue la primera errata, y los sapos se alimentan de ella desde entonces.'] },
      { spr: 'bard', name: ['Lamplighter Ru', 'Farolera Ru'], title: ['The King Who Forgot Esc', 'El rey que olvidó Esc'], fact: ['Djinn Insertus taught the old kings two modes. One king forgot Esc and typed his own name for a hundred years. His name still fills a page in the castle.', 'El Genio Insertus enseñó dos modos a los antiguos reyes. Un rey olvidó Esc y escribió su propio nombre durante cien años. Su nombre aún llena una página del castillo.'] },
    ],
  },
  {
    name: ['Chapter IV — Operator Caverns', 'Capítulo IV — Cavernas del Operador'], ground: { kind: 'rock', ramp: ['#2a2622', '#3b3530', '#514942', '#706559'], water: ['#0c1a33', '#132a52', '#24457c', '#6d9bd0'] }, wall: 'boulder', roamer: 'bat',
    intro: [
      ['', '', ['STAGE 4. Deep under the mountains, the Operator dwarves forge commands from two parts: a VERB and a MOTION.', 'NIVEL 4. Bajo las montañas, los enanos Operadores forjan comandos de dos partes: un VERBO y un MOVIMIENTO.']],
      ['', '', ['d to delete, c to change, and after it any motion you know. The grammar of vim is the grammar of power.', 'd para borrar, c para cambiar, y después cualquier movimiento que conozcas. La gramática de vim es la gramática del poder.']],
    ],
    map: MAPS[3],
    levels: ['delete', 'motions', 'change'],
    sages: [
      { spr: 'dwarf', name: ['Dwarf Dee', 'Enano Dee'], say: [
        ['Bloat! The spider spins lines nobody needs. We cut them out.', '¡Relleno! La araña teje líneas que nadie necesita. Nosotros las cortamos.'],
        ['Every monster down here grows stronger each round. Waste keystrokes and it strikes back.', 'Aquí abajo cada monstruo se hace más fuerte en cada ronda. Desperdicia teclas y contraatacará.'],
      ] },
      { spr: 'smith', name: ['Smith Dollar', 'Herrero Dólar'], say: [
        ['A verb alone does nothing, kid. Give it a motion and watch the sparks fly.', 'Un verbo solo no hace nada, chaval. Dale un movimiento y verás saltar chispas.'],
        ['The dark lake below... jump word to stone, stone to stone, then find the island path.', 'El lago oscuro de abajo... salta de palabra a piedra, de piedra a piedra, y luego busca el camino de islas.'],
      ] },
      { spr: 'changeling', name: ['Changeling Cee', 'Cambiante Cee'], say: [
        ['Why delete and then type, when you can do both in one breath?', '¿Por qué borrar y luego escribir, si puedes hacer ambas cosas de un solo golpe?'],
        ['The bat tunnels ahead are long, and bats never let you walk past. The stones in them are words: leap with w and b.', 'Los túneles de murciélagos son largos y nunca te dejan pasar caminando. Sus piedras son palabras: salta con w y b.'],
      ] },
    ],
    npcs: [
      { spr: 'miner', name: ['Miner', 'Minero'], say: [['Those bats fly in straight lines. Dumb bats. Smart cursors jump.', 'Esos murciélagos vuelan en línea recta. Murciélagos tontos. Los cursores listos saltan.']] },
      { spr: 'hermit', name: ['Hermit', 'Ermitaño'], say: [['I came down here to escape the mouse. Now I delete whole lines with two keys. dd. Beautiful.', 'Bajé aquí para escapar del ratón. Ahora borro líneas enteras con dos teclas. dd. Precioso.']] },
    ],
    lore: [
      { spr: 'keeper', name: ['Echo Miner Ivo', 'Minero Ivo'], title: ['The Operator Pact', 'El pacto del operador'], fact: ['The dwarves never cut a word without naming the motion first. \'Verb, then where,\' they chant. A mouse can only point; it can never name a motion.', 'Los enanos nunca cortan una palabra sin nombrar antes el movimiento. \'Verbo, y luego dónde\', cantan. Un ratón solo puede señalar; nunca nombra un movimiento.'] },
      { spr: 'bard', name: ['Bat Whisperer Lu', 'Susurradora Lu'], title: ['The Arrow Curse', 'La Maldición de las Flechas'], fact: ['Clive froze the arrow keys because he feared the home row. A hand that stays on h j k l can never be dragged back to the mouse.', 'Clive congeló las flechas porque temía a la fila guía. Una mano que se queda en h j k l nunca puede ser arrastrada de vuelta al ratón.'] },
    ],
  },
  {
    name: ['Chapter V — The Object Ruins', 'Capítulo V — Las Ruinas de los Objetos'], ground: { kind: 'tiles', ramp: ['#4a3a2a', '#6b5638', '#8f7748', '#c9a96e'] }, wall: 'brick', roamer: 'ghost',
    intro: [
      ['', '', ['STAGE 5. An ancient city built in pairs: every hall opens with ( and closes with ). Ghosts drift between the pillars.', 'NIVEL 5. Una ciudad antigua construida en parejas: cada sala se abre con ( y se cierra con ). Los fantasmas flotan entre los pilares.']],
      ['hero', '', ['Rubble and water fill every hall. I can\'t walk across... but the pillars come in pairs. If I leap from one to its partner, I\'m through.', 'Escombros y agua llenan cada sala. No puedo cruzar caminando... pero los pilares van en pareja. Si salto de uno a su pareja, paso.']],
    ],
    map: MAPS[4],
    levels: ['inside', 'around'],
    sages: [
      { spr: 'witch', name: ['Witch Inna', 'Bruja Inna'], say: [
        ['Words, quotes, parentheses... everything is an object, little cursor. Strike from the inside.', 'Palabras, comillas, paréntesis... todo es un objeto, pequeño cursor. Ataca desde dentro.'],
        ['The halls ahead are walled with rubble between pillars. Stand on a ( and leap with f) to its partner.', 'Las salas de delante tienen escombros entre pilares. Párate en un ( y salta con f) a su pareja.'],
      ] },
      { spr: 'ayla', name: ['Archivist Ayla', 'Archivista Ayla'], say: [
        ['Inside is only half of it. Around means the thing AND its wrapping: the word and its space, the brackets and all.', 'Dentro es solo la mitad. Alrededor es la cosa Y su envoltorio: la palabra y su espacio, los corchetes y todo.'],
        ['And here is a secret of the ruins: on any bracket, % takes you straight to its partner.', 'Y un secreto de las ruinas: sobre cualquier corchete, % te lleva directo a su pareja.'],
      ] },
    ],
    npcs: [
      { spr: 'explorer', name: ['Explorer', 'Exploradora'], say: [
        ['I came for the treasure and stayed for the brackets. Every ( has its ), you know. Always.', 'Vine por el tesoro y me quedé por los corchetes. Cada ( tiene su ), ¿sabes? Siempre.'],
      ] },
      { spr: 'mason', name: ['Old Mason', 'Viejo Albañil'], say: [
        ['There is a vault by the west wall. Its key fell somewhere in the east court.', 'Hay una cámara junto al muro oeste. Su llave cayó en algún lugar del patio este.'],
      ] },
    ],
    lore: [
      { spr: 'keeper', name: ['Ruin Scholar Bea', 'Erudita Bea'], title: ['The Paired City', 'La ciudad de las parejas'], fact: ['The Ruins were built by the first programmers. Every hall was opened with ( and closed with ), so no room was ever left unfinished.', 'Las Ruinas las construyeron los primeros programadores. Cada sala se abría con ( y se cerraba con ), para que ninguna quedara sin terminar.'] },
      { spr: 'bard', name: ['Tomb Guide Rex', 'Guía Rex'], title: ['The Wrapped Librarian', 'El bibliotecario envuelto'], fact: ['The Husk Mummy was a royal librarian who wrapped every word in brackets to keep it safe. Now he cannot find the words inside.', 'La Momia Envuelta era un bibliotecario real que envolvía cada palabra en corchetes para protegerla. Ahora no encuentra las palabras de dentro.'] },
    ],
  },
  {
    name: ['Chapter VI — Shapeshifter Coast', 'Capítulo VI — La Costa Cambiaformas'], ground: { kind: 'grass', ramp: ['#8f7a4e', '#c2a36b', '#dcc28a', '#f0dfae'], water: ['#1d4f6b', '#2a6f97', '#4f9cc4', '#a6dcef'] }, wall: 'oak', roamer: 'crab',
    intro: [
      ['', '', ['STAGE 6. A windy shore where nothing keeps its shape: villagers SHOUT one minute and whisper the next, cats copy everything, and an owl repeats your last word forever.', 'NIVEL 6. Una costa ventosa donde nada conserva su forma: los aldeanos GRITAN un minuto y susurran al siguiente, los gatos lo copian todo y un búho repite tu última palabra para siempre.']],
      ['hero', '', ['Islands, a long pier and crab rocks. The sea only lets me cross by leaping: islands with f, planks with w and b.', 'Islas, un muelle largo y rocas de cangrejos. El mar solo me deja cruzar saltando: islas con f, tablones con w y b.']],
    ],
    map: MAPS[5],
    levels: ['replace', 'yank', 'dot'],
    sages: [
      { spr: 'captain', name: ['Captain Tilde', 'Capitán Tilde'], say: [
        ['SHOUTING or whispering, I decide! And I fix a letter without ever entering insert mode.', '¡GRITAR o susurrar, yo decido! Y arreglo una letra sin entrar nunca en modo insertar.'],
        ['The Caps Wolf waits across the sea. Hop the islands: fo, then ; ; ;', 'El Lobo Mayúsculo espera al otro lado del mar. Salta por las islas: fo, y luego ; ; ;'],
      ] },
      { spr: 'teacher', name: ['Teacher Yank', 'Maestra Yank'], say: [
        ['Never type the same thing twice. Copy it. Vim calls it yanking. Don\'t ask why.', 'Nunca escribas lo mismo dos veces. Cópialo. Vim lo llama "yank". No preguntes por qué.'],
        ['The Copy Cat sits at the far end of the pier. Every plank is a word: b takes you back along it.', 'El Gato Copión está al final del muelle. Cada tablón es una palabra: b te lleva de vuelta por él.'],
      ] },
      { spr: 'monk', name: ['Monk Dot', 'Monje Punto'], say: [
        ['The wise one repeats... the wise one repeats... the wise one presses dot.', 'El sabio repite... el sabio repite... el sabio pulsa punto.'],
      ] },
    ],
    npcs: [
      { spr: 'sailor', name: ['Sailor', 'Marinera'], say: [
        ['The tide took my boat. Now I hop: from the beach, fo lands on the first island, ; on the next.', 'La marea se llevó mi barca. Ahora salto: desde la playa, fo cae en la primera isla, ; en la siguiente.'],
      ] },
      { spr: 'fisher', name: ['Old Fisher', 'Viejo Pescador'], say: [
        ['Out past the pier there are three little islands. Somebody lives on the far one, they say.', 'Más allá del muelle hay tres islitas. Dicen que alguien vive en la más lejana.'],
      ] },
    ],
    lore: [
      { spr: 'keeper', name: ['Tide Watcher Noa', 'Vigía Noa'], title: ['The Shifting Tide', 'La marea cambiante'], fact: ['This coast was once the Spelling Sea. When Clive clicked it, the waves began to swap letters, and the shore never kept its shape again.', 'Esta costa fue el Mar de la Ortografía. Cuando Clive hizo clic en él, las olas empezaron a cambiar letras y la orilla nunca volvió a tener su forma.'] },
      { spr: 'bard', name: ['Pearl Diver Gus', 'Buzo Gus'], title: ['The Clipboard Pearl', 'La perla del portapapeles'], fact: ['Teacher Yank keeps a pearl that remembers the last thing you yanked. Clive tried to steal it to copy himself. The Clicker Clones came from that day.', 'La Maestra Yank guarda una perla que recuerda lo último que copiaste. Clive intentó robarla para copiarse a sí mismo. Los Clones de Clicker nacieron ese día.'] },
    ],
  },
  {
    name: ['Chapter VII — Dr. Clicker\'s Tower', 'Capítulo VII — La Torre del Dr. Clicker'], ground: { kind: 'tiles', ramp: ['#1f1b2e', '#2e2944', '#423b5e', '#655d88'] }, wall: 'brick', roamer: 'pointer',
    intro: [
      ['', '', ['FINAL STAGE. At the top of the Tower of Objects, DR. CLICKER waits on his throne of mouse pads, finger on the button. His living pointers patrol every floor.',
        'NIVEL FINAL. En lo alto de la Torre de los Objetos, el DR. CLICKER espera en su trono de alfombrillas, con el dedo en el botón. Sus punteros vivientes patrullan cada piso.']],
      ['hero', '', ['Five floors. Three echoes of my old teachers test me, then Dr. Clicker himself. Everything I\'ve learned, I\'ll need here.', 'Cinco pisos. Tres ecos de mis viejos maestros me ponen a prueba, y luego el propio Dr. Clicker. Todo lo que aprendí lo necesitaré aquí.']],
    ],
    map: MAPS[6],
    levels: ['recap1', 'recap2', 'recap3', 'boss'],
    sages: [
      { spr: 'elder', name: ['Echo of Elder Hjkl', 'Eco del Anciano Hjkl'], say: [
        ['Remember the first lesson? Every gap wants its own leap: a word, an edge, a count, a find. Show me you still know them all.', '¿Recuerdas la primera lección? Cada hueco pide su propio salto: una palabra, un borde, una cuenta, una búsqueda. Demuéstrame que aún los conoces todos.'],
      ] },
      { spr: 'fairy', name: ['Echo of Fairy Xie', 'Eco del Hada Xie'], say: [
        ['Typos, gaps, lines, operators. The Drag Smear mixes them all. Fix each line with the spell it asks for.', 'Erratas, huecos, líneas, operadores. La Mancha de Arrastre los mezcla todos. Arregla cada línea con el hechizo que pide.'],
      ] },
      { spr: 'witch', name: ['Echo of Witch Inna', 'Eco de la Bruja Inna'], say: [
        ['The clones copy everything. Answer with objects, yanks and the dot.', 'Los clones lo copian todo. Responde con objetos, copias y el punto.'],
      ] },
      { spr: 'king', name: ['Ghost of King Bram', 'Fantasma del Rey Bram'], say: [
        ['I ruled Textoria before the curse. Dr. Clicker waits beyond this door.', 'Goberné Textoria antes de la maldición. El Dr. Clicker espera tras esta puerta.'],
        ['He will throw every trick at you, round after round. You have every spell you need. Use them all, PROMPT.', 'Te lanzará todos sus trucos, ronda tras ronda. Tienes todos los hechizos que necesitas. Úsalos todos, PROMPT.'],
      ] },
    ],
    npcs: [],
    lore: [
      { spr: 'keeper', name: ['Ghost Page Mira', 'Paje Fantasma Mira'], title: ['King Bram\'s Fall', 'La caída del Rey Bram'], fact: ['King Bram refused to trade his keyboard for a mouse. Clive double-clicked the throne, and the king became a ghost of his own tower.', 'El Rey Bram se negó a cambiar su teclado por un ratón. Clive hizo doble clic en el trono y el rey se convirtió en un fantasma de su propia torre.'] },
      { spr: 'bard', name: ['Treasurer Sol', 'Tesorero Sol'], title: ['The Last Save', 'La última partida guardada'], fact: ['Before he fell, King Bram hid the kingdom\'s last save file in this tower. Whoever defeats Dr. Clicker can restore Textoria from it, every word intact.', 'Antes de caer, el Rey Bram escondió la última partida guardada del reino en esta torre. Quien venza al Dr. Clicker podrá restaurar Textoria con ella, sin perder una palabra.'] },
    ],
  },
];

const MONSTERS: Record<SpellId, Monster> = {
  hjkl: { spr: 'ratBoss', name: ['Arrow Rat', 'Rata Flecha'], taunt: ['Squeak! Arrow keys forever! I nibbled the letters out of your words!', '¡Iiic! ¡Flechas para siempre! ¡Me comí las letras de tus palabras!'] },
  words: { spr: 'batBoss', name: ['Word Bat', 'Murciélago Verbal'], taunt: ['Skreee! I flutter between words faster than you can blink!', '¡Skriii! ¡Revoloteo entre palabras más rápido de lo que parpadeas!'] },
  edges: { spr: 'snailBoss', name: ['Margin Snail', 'Caracol Margen'], taunt: ['Slooow... I hide my treasures at the ends of lines...', 'Leeento... escondo mis tesoros al final de las líneas...'] },
  counts: { spr: 'boarBoss', name: ['Tally Boar', 'Jabalí Contador'], taunt: ['GRUNT. One step, two steps, ten steps. You\'ll be exhausted before you reach me!', 'GRUÑ. Un paso, dos pasos, diez pasos. ¡Estarás agotado antes de alcanzarme!'] },
  find: { spr: 'serpentBoss', name: ['Seeker Serpent', 'Serpiente Buscadora'], taunt: ['Sssss... find the missing letterssss if you can...', 'Sssss... encuentra las letras perdidassss si puedessss...'] },
  x: { spr: 'toadBoss', name: ['Typo Toad', 'Sapo Errata'], taunt: ['Ribbbit! I put extra letters everywheree!', '¡Croooac! ¡Pongo letras de más por todass partes!'] },
  insert: { spr: 'goblinBoss', name: ['Gap Goblin', 'Duende Hueco'], taunt: ['Hehehe! I stole letters from your sentences!', '¡Jejeje! ¡Robé letras de tus frases!'] },
  lines: { spr: 'lizardBoss', name: ['Line Lizard', 'Lagarto Lineal'], taunt: ['Semicolons? Comments? I ate them all!', '¿Puntos y coma? ¿Comentarios? ¡Me los comí todos!'] },
  delete: { spr: 'spiderBoss', name: ['Bloat Spider', 'Araña Relleno'], taunt: ['More lines! More words! Very very very many words!', '¡Más líneas! ¡Más palabras! ¡Muchas muchas muchas palabras!'] },
  motions: { spr: 'scorpionBoss', name: ['Debug Scorpion', 'Escorpión Depurador'], taunt: ['console.log everywhere! Leave my TODOs alone!', '¡console.log por todas partes! ¡Deja mis TODOs en paz!'] },
  change: { spr: 'crabBoss', name: ['Mimic Crab', 'Cangrejo Mímico'], taunt: ['Click clack! I swapped your words for cats and dogs!', '¡Clic clac! ¡Cambié tus palabras por gatos y perros!'] },
  around: { spr: 'mummy', name: ['Husk Mummy', 'Momia Envuelta'], taunt: ['Mmmmph! Wrapped in (layers) and [layers] and (more layers)... you\'ll never unwrap me!', '¡Mmmmf! Envuelto en (capas) y [capas] y (más capas)... ¡nunca me desenvolverás!'] },
  inside: { spr: 'ghostBoss', name: ['Bracket Ghost', 'Fantasma Corchete'], taunt: ['Boooo... I live inside the quotes and parentheses...', 'Buuuu... vivo dentro de las comillas y los paréntesis...'] },
  replace: { spr: 'wolfBoss', name: ['Caps Wolf', 'Lobo Mayúsculo'], taunt: ['AWOOO! i Mess Up yOuR cApItAlS!', '¡AUUU! ¡mE cOmO tUs MaYúScUlAs!'] },
  yank: { spr: 'catBoss', name: ['Copy Cat', 'Gato Copión'], taunt: ['Meow. Hip... hooray? You\'re missing a hip.', 'Miau. ¿Hip... hurra? Te falta un hip.'] },
  dot: { spr: 'owlBoss', name: ['Echo Owl', 'Búho Eco'], taunt: ['Foo! foo! foo! foo! Can you change them all?', '¡Foo! ¡foo! ¡foo! ¡foo! ¿Puedes cambiarlos todos?'] },
  recap1: { spr: 'swarmBoss', name: ['Click Swarm', 'Enjambre de Clics'], taunt: ['Click click click! A thousand pointers, a thousand gaps. Can your leaps keep up?', '¡Clic clic clic! Mil punteros, mil huecos. ¿Tus saltos pueden seguir el ritmo?'] },
  recap2: { spr: 'smearBoss', name: ['Drag Smear', 'Mancha de Arrastre'], taunt: ['Sluuurp. I dragged every line through the mud. Typos, gaps, junk: all mine.', 'Sluuurp. Arrastré cada línea por el barro. Erratas, huecos, basura: todo mío.'] },
  recap3: { spr: 'cloneBoss', name: ['Clicker Clone', 'Clon de Clicker'], taunt: ['I am Dr. Clicker! No, I am! We were copy-pasted. Ctrl-C, Ctrl-V, forever!', '¡Soy el Dr. Clicker! ¡No, yo! Nos copiaron y pegaron. ¡Ctrl-C, Ctrl-V, para siempre!'] },
  boss: { spr: 'clicker', name: ['DR. CLICKER', 'DR. CLICKER'], taunt: [
    'MWAHAHA! So the little blinking cursor learned to type. I mangled every line in my tower. You\'ll never fix them all! CLICK CLICK CLICK!',
    '¡MUAJAJA! Así que el cursorcito aprendió a escribir. Destrocé cada línea de mi torre. ¡Nunca las arreglarás todas! ¡CLIC CLIC CLIC!'] },
};

// roaming monsters (chapter.roamer sprites) by name
const ROAMERS: Record<string, Tx> = {
  rat: ['Sewer Rat', 'Rata de Cloaca'], boar: ['Wild Boar', 'Jabalí Salvaje'], mosquito: ['Swamp Mosquito', 'Mosquito del Pantano'],
  bat: ['Cave Bat', 'Murciélago de Cueva'], ghost: ['Wandering Ghost', 'Fantasma Errante'], crab: ['Beach Crab', 'Cangrejo de Playa'],
  pointer: ['Living Pointer', 'Puntero Viviente'],
};

const ENDING: Line[] = [
  ['clicker', '', ['DR. CLICKER shatters into a thousand pixels. His mouse pointer flickers... and fades. GAME OVER, doctor.', 'El DR. CLICKER estalla en mil píxeles. Su puntero parpadea... y se apaga. GAME OVER, doctor.']],
  ['', '', ['Across Textoria, hands return to the home row. The words heal. The swamp clears. The fields can be counted again.', 'Por toda Textoria, las manos vuelven a la fila guía. Las palabras sanan. El pantano se aclara. Los campos pueden contarse de nuevo.']],
  ['king', ['King Bram', 'Rey Bram'], ['THANK YOU, PROMPT! But remember: a vimmer\'s quest never truly ends.', '¡GRACIAS, PROMPT! Pero recuerda: la aventura de un vimmer nunca termina del todo.']],
  ['', '', ['THE END. Replay any battle with :train to earn ★★★ on every one. Then try the Vimmer level.', 'FIN. Repite cualquier batalla con :train y consigue ★★★ en todas. Luego prueba el nivel Vimmer.']],
];

export { CHAPTERS, MONSTERS, ROAMERS, ENDING };
