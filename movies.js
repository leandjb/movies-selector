// Curated movie catalog for the voting landing page (six-film roster).
// Scores are hand-curated reference values (sourced at build time); a null
// score renders as a "—" placeholder. Posters are TMDB CDN URLs (verified
// 200 AND verified to depict the correct film); trailers are official
// YouTube videos (verified via oEmbed). Votes are allocated from the
// visitor's vote budget — there is no seeded initial score.
const MOVIES = [
  {
    id: "her-2013",
    title: "Her",
    year: 2013,
    imdb: 8.0,
    rt: 94,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/XsQqMwacZQw",
    trailerWatchUrl: "https://www.youtube.com/watch?v=XsQqMwacZQw",
  },
  {
    id: "project-hail-mary-2026",
    title: "Project Hail Mary",
    year: 2026,
    imdb: 8.2,
    rt: 95,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/yihdXomYb5kTeSivtFndMy5iDmf.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/m08TxIsFTRI",
    trailerWatchUrl: "https://www.youtube.com/watch?v=m08TxIsFTRI",
  },
  {
    id: "one-battle-after-another-2025",
    title: "One Battle After Another",
    year: 2025,
    imdb: 7.6,
    rt: 96,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/lbBWwxBht4JFP5PsuJ5onpMqugW.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/feOQFKv2Lw4",
    trailerWatchUrl: "https://www.youtube.com/watch?v=feOQFKv2Lw4",
  },
  {
    id: "crimson-tide-1995",
    title: "Crimson Tide",
    year: 1995,
    imdb: 7.3,
    rt: 88,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/21nqRJ6ofEgVvEl68J4O9V26Xzy.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/iS4I2Z1RBIw",
    trailerWatchUrl: "https://www.youtube.com/watch?v=iS4I2Z1RBIw",
  },
  {
    id: "hot-chick-2002",
    title: "The Hot Chick",
    year: 2002,
    imdb: 5.5,
    rt: 37,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/lnnGE4TKa05t20SZ2batuAhXCp4.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/6z5zbY-0QCA",
    trailerWatchUrl: "https://www.youtube.com/watch?v=6z5zbY-0QCA",
  },
  {
    id: "grand-budapest-2014",
    title: "The Grand Budapest Hotel",
    year: 2014,
    imdb: 8.1,
    rt: 92,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/1Fg5iWmQjwk",
    trailerWatchUrl: "https://www.youtube.com/watch?v=1Fg5iWmQjwk",
  },
];
