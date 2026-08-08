// ─────────────────────────────────────────────────────────────
// SITE CONTENT — edit this file only. Do not touch App.tsx.
// To change anything on the site (links, bio, song, video),
// change the values here, commit, and push.
// ─────────────────────────────────────────────────────────────

export const SITE = {
  // Brand
  name: 'ASH WILLS',
  tagline: 'musician · tech artist',

  // Boot messages shown on load
  introLines: [
    '> initializing ash.wills.sys...',
    '> signal found.',
    '> tap a command or type one.',
  ],

  // Nav / command shortcuts (label shown, target = section id)
  commands: [
    { label: 'music', target: 'music' },
    { label: 'youtube', target: 'youtube' },
    { label: 'tour', target: 'tour' },
    { label: 'join', target: 'join' },
  ],

  // Music — new single
  music: {
    badge: 'NEW SINGLE',
    single: {
      title: 'CRASHING OUT',
      artwork:
        'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a5/3a/8c/a53a8c46-a571-1d7d-0db0-f70127d69562/artwork.jpg/1000x1000bb.jpg',
      spotifyEmbed:
        'https://open.spotify.com/embed/track/5elUf5WWJ69qIDsBmCfQUc?utm_source=generator&theme=0',
      appleMusic: 'https://music.apple.com/us/album/crashing-out-single/6783549319',
    },
    cta: {
      prompt: '> liked what you heard?',
      body: 'Get early access to new releases, show dates, and behind-the-scenes from the studio.',
      button: 'join the list →',
    },
  },

  // YouTube — featured video
  youtube: {
    heading: 'latest video',
    videoId: 'sh8N9n_0pTM',
    channelUrl: 'https://www.youtube.com/@awillsss',
    subscribeText: '> @awillsss — subscribe ↗',
  },

  // Socials — real profiles
  socials: [
    { label: 'apple music ↗', url: 'https://music.apple.com/us/album/crashing-out-single/6783549319' },
    { label: 'youtube ↗', url: 'https://www.youtube.com/@awillsss' },
    { label: 'instagram', url: 'https://www.instagram.com/birthname.io/' },
    { label: 'tiktok', url: 'https://www.tiktok.com/@gushinurmouth' },
  ],

  // Tour
  tour: {
    heading: 'shows',
    emptyLine: '> no dates confirmed yet',
    emptyBody: 'Join the list below to be first when shows drop.',
    comingSoon: 'coming soon',
  },

  // Join the list
  join: {
    heading: 'join the community',
    description:
      "Not a newsletter. Show announcements, early drops, and studio dispatches — when there's something worth saying.",
    nameLabel: 'name',
    namePlaceholder: 'your name',
    emailLabel: 'email',
    emailPlaceholder: 'your@email.com',
    submit: '> send it →',
    submitting: '> sending...',
    successLine: "you're in the system.",
    alreadyLine: '> you were already on the list.',
    confirmLine: "check your inbox to confirm — you'll hear from ash when it matters.",
    localLine: "you'll hear from ash when it matters.",
  },

  // About
  about: [
    'Ash Wills is a musician and tech artist working at the edge of electronic music and software. Known for layered production, noise aesthetics, and live performance systems that blur the line between instrument and code.',
    'Based somewhere with bad weather and good reverb.',
  ],
}
