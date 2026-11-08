/* Your story lives here. Edit names, dialogue, recollections and colours freely.
   Keep IDs unique; coordinates use the 1800 × 1320 town map. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HollowhavenContent = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    residents: [
      { id: 'mara', name: 'Mara, the Candlekeeper', x: 445, y: 370, color: '#b9a379',
        lines: ['I keep a candle for everyone who has forgotten their own name. Yours is still burning, Visreal.', 'The ward lanterns keep their memories. Light them all, then ring the sanctuary bell.'] },
      { id: 'orren', name: 'Orren, the Bellkeeper', x: 1300, y: 370, color: '#9daab0',
        lines: ['The bell does not bring the night. It tells the night we are ready.', 'When a soul follows your light, bring it inside the sanctuary circle. You can lead more than one home.'] },
      { id: 'iva', name: 'Iva, the Mender', x: 510, y: 850, color: '#ae8898',
        lines: ['There are little memories caught between the stones. Gather them. A remembered life makes your lantern reach farther.', 'A wraith fears two pulses of lantern light. Walk between pulses to let the lantern refill.'] }
    ],
    memories: [
      { id: 'ribbon', title: 'A ribbon in the rain', x: 900, y: 350,
        text: 'Someone tied a red ribbon to a door so their brother could find his way home. The door is gone. The ribbon remembers.' },
      { id: 'song', title: 'The unfinished song', x: 445, y: 815,
        text: 'Three notes rise from the broken cobbles. Somewhere beyond the veil, a musician is waiting for the fourth.' },
      { id: 'letter', title: 'A letter never sent', x: 1320, y: 995,
        text: 'The ink has faded, but one line remains: I will leave the light on. You fold the letter carefully into your coat.' }
    ],
    souls: [
      { id: 'lamplighter', x: 250, y: 335, name: 'The Lamplighter', recollection: 'He lit every street but his own. Tonight, someone carried a light for him.' },
      { id: 'musician', x: 1550, y: 350, name: 'The Musician', recollection: 'She could not remember the melody until she heard the sanctuary bells.' },
      { id: 'wanderer', x: 1390, y: 980, name: 'The Wanderer', recollection: 'He had spent so long searching for a place to belong that he forgot home could be a person.' }
    ]
  };
});
