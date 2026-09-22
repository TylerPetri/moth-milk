/**
 * @param {{
 *   slug: string;
 *   title: string;
 *   minutes: number;
 *   theme: string;
 *   shelf: number[];
 *   spine: Record<string, string | number>;
 *   description: string;
 *   excerpt: string[];
 *   cover: { position: number; accent: string; rotation: number };
 * }} entry
 */
const book = (entry) => ({
  ...entry,
  shelf: {
    x: entry.shelf[0],
    y: entry.shelf[1],
    width: entry.shelf[2],
    height: entry.shelf[3],
    image: `${entry.slug}.webp`
  }
});

export const libraryBooks = [
  book({
    slug: 'the-briar-room', title: 'The Briar Room', minutes: 11, theme: 'briar', shelf: [42, 81, 32, 164],
    spine: { width: 2.1, height: 82, lean: -0.5, texture: 0, decor: 'motif', accent: '#ba9565', mark: '✦', ornamentY: 52 },
    cover: { position: 50, accent: '#b89668', rotation: -0.7 },
    description: 'A locked bedroom grows one new thorn every night, all of them pointing toward the wardrobe.',
    excerpt: ['The first thorn came through the wallpaper behind Wren’s pillow. It was pale, almost soft, and curved toward the wardrobe across the room.', 'By Friday there were thirteen. She cut them down before school. Each night they returned longer, their tips wet with something clear and warm.', 'On Sunday, the wardrobe door opened by itself. Every thorn in the room turned to face her.']
  }),
  book({
    slug: 'room-14', title: 'Room 14', minutes: 8, theme: 'room', shelf: [92, 63, 33, 182],
    spine: { width: 2.5, height: 96, lean: 0.25, texture: 7, decor: 'label', accent: '#c6ad82', mark: '14', ornamentY: 44 },
    cover: { position: 25, accent: '#c9b38c', rotation: 0.5 },
    description: 'The motel has thirteen rooms during the day. After midnight, one more key appears behind the desk.',
    excerpt: ['Mae counted the brass hooks twice. Thirteen keys, just as there had been when her shift began.', 'At 12:14, a fourteenth key swung gently beneath a label written in her own handwriting. ROOM 14. OCCUPIED.', 'The bell on the counter rang. A girl wearing Mae’s coat stood outside in the rain and asked to be let back in.']
  }),
  book({
    slug: 'moth-house', title: 'Moth House', minutes: 16, theme: 'moth-house', shelf: [137, 67, 41, 178],
    spine: { width: 3.1, height: 93, lean: -0.35, texture: 4, decor: 'motif', accent: '#c0a77a', mark: '✣', ornamentY: 57 },
    cover: { position: 75, accent: '#c6aa7d', rotation: -0.25 },
    description: 'Every porch light on the street goes dark except one, where the moths have begun arranging themselves into words.',
    excerpt: ['The moths arrived in August, powdering the porch with silver wings. Mina swept them away each morning and found twice as many after sunset.', 'On the third night they settled across the glass in four careful letters: OPEN.', 'Behind the door, something tapped the same word from inside the wall.']
  }),
  book({
    slug: 'static', title: 'Static', minutes: 12, theme: 'signal', shelf: [177, 56, 55, 189],
    spine: { width: 3.55, height: 96, lean: -0.65, texture: 2, decor: 'frame', accent: '#df3944', mark: '✦', ornamentY: 57 },
    cover: { position: 0, accent: '#b32c36', rotation: -0.8 },
    description: 'A dead television begins broadcasting a room that looks almost like Mara’s—five minutes ahead.',
    excerpt: ['At 3:17, the television turned itself on. There was no burst of music, no blue menu, only a room filmed from somewhere near the ceiling.', 'Mara recognized the red blanket first. Then the cup cooling beside her knee. On the screen, she was still reading. In the room, she had already stopped.', 'The girl inside the television lifted her head and looked directly into the corner where the camera should have been.']
  }),
  book({
    slug: 'hush', title: 'Hush', minutes: 18, theme: 'hush', shelf: [239, 73, 44, 172],
    spine: { width: 3.05, height: 88, lean: 0.35, texture: 1, decor: 'motif', accent: '#e2c081', mark: '✢', ornamentY: 56 },
    cover: { position: 25, accent: '#c2a575', rotation: 0.65 },
    description: 'Four friends agree not to speak until sunrise. Something in the hallway takes the rule more seriously than they do.',
    excerpt: ['The rule was Liv’s idea: no talking until the sun touched the windows. Anyone who slipped had to walk home alone.', 'At first they wrote jokes on the backs of receipts. By two, the apartment was quiet enough to hear the pipes ticking inside the walls.', 'At three, someone whispered Liv’s name from the hall. All four girls were still in the room.']
  }),
  book({
    slug: 'afterimage', title: 'Afterimage', minutes: 7, theme: 'afterimage', shelf: [285, 59, 34, 186],
    spine: { width: 1.8, height: 95, lean: 0.2, texture: 10, decor: 'plain', accent: '#b89d76', mark: '', ornamentY: 55 },
    cover: { position: 100, accent: '#a99370', rotation: 0.2 },
    description: 'The flash from an old camera leaves a girl-shaped shadow that remains after the photograph develops.',
    excerpt: ['The disposable camera had one exposure left. June aimed it at the empty corner and pressed the shutter to make Liv laugh.', 'For several seconds, a white shape remained burned into her sight. It was the outline of a girl with both hands over her face.', 'When the photograph developed, the corner was empty. The girl was standing behind June.']
  }),
  book({
    slug: 'the-hall', title: 'The Hall', minutes: 9, theme: 'hall', shelf: [320, 59, 54, 186],
    spine: { width: 3.6, height: 98, lean: -0.3, texture: 4, decor: 'frame', accent: '#e3d4ba', mark: '◇', ornamentY: 59 },
    cover: { position: 50, accent: '#c4b59c', rotation: -0.2 },
    description: 'The corridor outside apartment 6B gets longer every night, but only after the last train stops running.',
    excerpt: ['The elevator was six steps from June’s door. She had counted often enough to know.', 'Tonight there were nine. Then twelve. Behind her, the brass number 6B looked small and far away.', 'The elevator opened at the other end of the hall. June was already standing inside it.']
  }),
  book({
    slug: 'no-signal', title: 'No Signal', minutes: 15, theme: 'void', shelf: [375, 62, 63, 183],
    spine: { width: 3.3, height: 92, lean: 0.8, texture: 6, decor: 'sigil', accent: '#ead1a0', mark: '☾', ornamentY: 60 },
    cover: { position: 75, accent: '#c9b792', rotation: 0.4 },
    description: 'A group call keeps reconnecting after everyone has gone home—and one camera is showing tomorrow.',
    excerpt: ['Nia closed the laptop at 2:44. The call continued through the speakers anyway: breathing, a chair leg scraping, the soft pulse of bad reception.', 'Her phone lit up with four messages at once. Everyone said the same thing. They had left the call. They could still see her.', 'In the last square of the grid, morning light filled Nia’s room. Her chair was empty.']
  }),
  book({
    slug: 'red-hours', title: 'Red Hours', minutes: 13, theme: 'red-hours', shelf: [439, 69, 39, 176],
    spine: { width: 2.5, height: 90, lean: 0.2, texture: 3, decor: 'bands', accent: '#b87c61', mark: '', ornamentY: 38 },
    cover: { position: 0, accent: '#9e3238', rotation: -0.35 },
    description: 'At 3:06 every clock in the house turns red, and one lost hour begins repeating behind the bedroom door.',
    excerpt: ['At 3:06 the digits on Lea’s alarm clock changed from green to red. Downstairs, the microwave did the same.', 'She heard her friends laughing in the bedroom, though they had left almost an hour ago.', 'When she opened the door, they looked up from the carpet. None of them remembered leaving.']
  }),
  book({
    slug: 'half-moon', title: 'Half Moon', minutes: 10, theme: 'half-moon', shelf: [479, 60, 49, 185],
    spine: { width: 3.1, height: 95, lean: -0.25, texture: 9, decor: 'sigil', accent: '#c4ac7c', mark: '☾', ornamentY: 51 },
    cover: { position: 75, accent: '#b9a37e', rotation: 0.35 },
    description: 'A crescent-shaped mark appears beneath Ana’s window, moving closer to her bed each morning.',
    excerpt: ['The mark looked like damp at first: a thin crescent on the floor beneath the window.', 'The next morning it was beside her desk. By Thursday it touched the leg of the bed.', 'Ana stayed awake that night. Just before dawn, the moonlight peeled itself from the floor and stood up.']
  }),
  book({
    slug: 'guest-book', title: 'Guest Book', minutes: 14, theme: 'guest-book', shelf: [530, 75, 50, 170],
    spine: { width: 2.9, height: 86, lean: 0.15, texture: 5, decor: 'label', accent: '#b89668', mark: 'III', ornamentY: 43 },
    cover: { position: 50, accent: '#92785b', rotation: -0.3 },
    description: 'Names appear in a guest book before the visitors arrive. The final name belongs to the girl reading it.',
    excerpt: ['The cottage guest book was filled with the same neat handwriting, though the entries stretched back forty years.', 'Each visitor arrived the day after their name appeared. Some stayed for tea. Some only stared through the window.', 'On the last blank page, Erin found tomorrow’s date and her own signature.']
  }),
  book({
    slug: 'underbed', title: 'Underbed', minutes: 21, theme: 'underbed', shelf: [582, 60, 49, 185],
    spine: { width: 3.7, height: 87, lean: -0.9, texture: 9, decor: 'frame', accent: '#df3944', mark: '✣', ornamentY: 59 },
    cover: { position: 100, accent: '#b02c35', rotation: -0.55 },
    description: 'There is nothing under the bed. The voice beneath it agrees, every night, in exactly her voice.',
    excerpt: ['When Elise was seven, her mother taught her to check beneath the bed. At nineteen, she still did it whenever she slept somewhere new.', 'The first night in the apartment, the space below was empty. “Nothing there,” she said, embarrassed by the sound of her own relief.', 'From the dark beneath the mattress, her voice answered: “Nothing here.”']
  }),
  book({
    slug: 'visitor', title: 'Visitor', minutes: 6, theme: 'visitor', shelf: [636, 73, 38, 172],
    spine: { width: 2.35, height: 88, lean: 0.35, texture: 8, decor: 'motif', accent: '#b98a66', mark: '✦', ornamentY: 55 },
    cover: { position: 25, accent: '#a66c5d', rotation: 0.5 },
    description: 'Someone knocks at the balcony door of a seventh-floor apartment during a sleepover.',
    excerpt: ['The first knock was too soft for anyone else to hear. Cal looked toward the balcony and saw only her reflection.', 'The second knock silenced the room. They lived on the seventh floor. There was no fire escape.', 'A hand pressed against the glass from outside. Cal’s reflection raised its hand to meet it.']
  }),
  book({
    slug: 'borrowed-face', title: 'Borrowed Face', minutes: 17, theme: 'borrowed-face', shelf: [675, 74, 41, 171],
    spine: { width: 2.4, height: 87, lean: -0.2, texture: 6, decor: 'plain', accent: '#a89978', mark: '', ornamentY: 58 },
    cover: { position: 100, accent: '#9b876f', rotation: -0.4 },
    description: 'A thrift-store mirror reflects whoever used it last, and she wants her face returned before sunrise.',
    excerpt: ['Miri bought the mirror because its silver had gone cloudy around the edges. It made everyone look softly haunted.', 'At home, her reflection kept its eyes closed. When it opened them, the face in the glass belonged to someone else.', 'The stranger touched the inside of the mirror and mouthed two words: give it back.']
  }),
  book({
    slug: 'sleep-study', title: 'Sleep Study', minutes: 19, theme: 'sleep-study', shelf: [716, 61, 42, 184],
    spine: { width: 2.7, height: 94, lean: 0.1, texture: 10, decor: 'label', accent: '#c4ad87', mark: 'IV', ornamentY: 44 },
    cover: { position: 50, accent: '#baa889', rotation: 0.15 },
    description: 'Three volunteers wake with the same dream recorded in their files—and a fourth bed occupied.',
    excerpt: ['The clinic promised cash, breakfast, and eight uninterrupted hours of sleep. Noor expected wires and fluorescent light.', 'At 4:12, every monitor began drawing the same shape: a door viewed from very far away.', 'The empty fourth bed creaked. Someone beneath its blanket whispered that they were all still dreaming.']
  }),
  book({
    slug: 'bell-jar', title: 'Bell Jar', minutes: 12, theme: 'bell-jar', shelf: [756, 59, 41, 186],
    spine: { width: 3, height: 96, lean: -0.25, texture: 11, decor: 'motif', accent: '#bc9e70', mark: '◇', ornamentY: 50 },
    cover: { position: 75, accent: '#b69268', rotation: -0.55 },
    description: 'A glass jar found in the attic contains the sound of a bell that no one else can hear.',
    excerpt: ['The jar was sealed with black wax and warm despite the attic cold. Tess held it to her ear and heard a bell beneath the glass.', 'That night the ringing followed her into sleep. Each note sounded closer than the last.', 'In the morning, the wax seal lay broken on her bedside table. The jar was quiet. The bell was not.']
  }),
  book({
    slug: 'thin-walls', title: 'Thin Walls', minutes: 9, theme: 'thin-walls', shelf: [797, 76, 42, 169],
    spine: { width: 2.55, height: 86, lean: 0.25, texture: 3, decor: 'sigil', accent: '#a68661', mark: '✢', ornamentY: 62 },
    cover: { position: 0, accent: '#9c6e5d', rotation: 0.4 },
    description: 'The new neighbor rehearses every conversation one night before it happens.',
    excerpt: ['Through the wall, Bea heard a woman say good morning. The answer came in Bea’s own voice.', 'The next day a woman in the elevator greeted her with the same words. Bea answered exactly as the wall had.', 'That evening, the neighbor began rehearsing Bea’s scream.']
  }),
  book({
    slug: 'house-rules', title: 'House Rules', minutes: 13, theme: 'house-rules', shelf: [839, 82, 36, 163],
    spine: { width: 2.2, height: 83, lean: -0.1, texture: 1, decor: 'bands', accent: '#b49a72', mark: '', ornamentY: 38 },
    cover: { position: 25, accent: '#a48b6d', rotation: -0.2 },
    description: 'A handwritten list gains a new rule whenever the roommates break one they were never told about.',
    excerpt: ['The list appeared beneath a magnet on the refrigerator. NO SHOES UPSTAIRS. NO MIRRORS AFTER DARK.', 'They laughed until Dani carried a mirror through the hall at midnight. A third line bled slowly through the paper.', 'IF IT USES YOUR NAME, DO NOT ANSWER. From upstairs, Dani called for them to come look.']
  }),
  book({
    slug: 'cold-water', title: 'Cold Water', minutes: 11, theme: 'cold-water', shelf: [875, 70, 33, 175],
    spine: { width: 2.25, height: 90, lean: 0.3, texture: 8, decor: 'plain', accent: '#a65558', mark: '', ornamentY: 55 },
    cover: { position: 100, accent: '#a7343b', rotation: 0.3 },
    description: 'The bathtub fills itself every night with water from somewhere much deeper than the pipes.',
    excerpt: ['Mara woke to the sound of water running. The bathroom tap was dry, but the tub had filled to the rim.', 'Black sand covered the bottom. Something pale moved beneath the surface and bumped gently against the enamel.', 'Her phone rang from under the water. The screen showed a photograph of the bathroom taken from inside the drain.']
  }),
  book({
    slug: 'night-index', title: 'Night Index', minutes: 20, theme: 'night-index', shelf: [906, 76, 32, 169],
    spine: { width: 2.45, height: 86, lean: -0.25, texture: 5, decor: 'frame', accent: '#b39a75', mark: '✦', ornamentY: 64 },
    cover: { position: 50, accent: '#9f886e', rotation: -0.3 },
    description: 'A library card catalogue lists every dream in town, including the ones no one wakes from.',
    excerpt: ['The drawer marked NIGHTS had been painted shut. Pia found it open during closing, its cards arranged in alphabetical order.', 'Each card held a name, a date, and a dream described in perfect detail. Hers was filed under TOMORROW.', 'At the bottom, in red ink, someone had written: do not let her reach the door.']
  }),
  book({
    slug: 'wake', title: 'Wake', minutes: 5, theme: 'wake', shelf: [938, 82, 29, 163],
    spine: { width: 1.8, height: 83, lean: 0.1, texture: 6, decor: 'motif', accent: '#b9a47e', mark: '◇', ornamentY: 52 },
    cover: { position: 0, accent: '#aa3940', rotation: 0.2 },
    description: 'A voice note recorded during sleep contains one instruction in a voice that is almost hers.',
    excerpt: ['At 3:33, Sol’s phone recorded eleven seconds of darkness. She found the file in the morning.', 'Most of it was the soft mechanical hum of her room. At the end, her sleeping voice said, “Wake me before I get back.”', 'From inside the wardrobe, something began to breathe faster.']
  }),
  book({
    slug: 'the-attic', title: 'The Attic', minutes: 14, theme: 'attic', shelf: [968, 61, 11, 184],
    spine: { width: 2.7, height: 94, lean: -0.2, texture: 10, decor: 'label', accent: '#b6a382', mark: '7', ornamentY: 59 },
    cover: { position: 75, accent: '#ae9879', rotation: -0.45 },
    description: 'The attic light comes on whenever someone in the house remembers a room that does not exist.',
    excerpt: ['The pull-chain trembled above the landing, though every window was shut. A line of light showed around the attic door.', 'Nell remembered a bedroom up there: yellow curtains, a narrow bed, a girl asleep beneath a red quilt.', 'The memory was impossible. The house had no attic. Above her, the sleeping girl turned over.']
  })
].map((entry, index) => ({ ...entry, issue: String(index + 1).padStart(3, '0') }));
