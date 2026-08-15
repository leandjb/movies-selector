// Curated movie catalog for the voting landing page.
// Scores are hand-curated reference values. Poster URLs are TMDB CDN
// (verified at build time); trailer URLs are official YouTube trailers
// (verified via oEmbed). `initialVotes` seeds the community ranking so the
// board doesn't start at all zeros. A movie with no trailer fields renders
// without a trailer button (see spec: movie-catalog).
const MOVIES = [
  {
    id: "shawshank-1994",
    title: "The Shawshank Redemption",
    year: 1994,
    imdb: 9.3,
    rt: 89,
    initialVotes: 128,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/PLl99DlL6b4",
    trailerWatchUrl: "https://www.youtube.com/watch?v=PLl99DlL6b4",
  },
  {
    id: "dark-knight-2008",
    title: "The Dark Knight",
    year: 2008,
    imdb: 9.0,
    rt: 94,
    initialVotes: 141,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/EXeTwQWrcwY",
    trailerWatchUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
  },
  {
    id: "godfather-1972",
    title: "The Godfather",
    year: 1972,
    imdb: 9.2,
    rt: 97,
    initialVotes: 126,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    // No trailer link on purpose: exercises the "movie without a trailer"
    // scenario in the spec (card renders, no trailer button).
  },
  {
    id: "pulp-fiction-1994",
    title: "Pulp Fiction",
    year: 1994,
    imdb: 8.9,
    rt: 92,
    initialVotes: 112,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/s7EdQ4FqbhY",
    trailerWatchUrl: "https://www.youtube.com/watch?v=s7EdQ4FqbhY",
  },
  {
    id: "inception-2010",
    title: "Inception",
    year: 2010,
    imdb: 8.8,
    rt: 87,
    initialVotes: 105,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/YoHD9XEInc0",
    trailerWatchUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
  },
  {
    id: "parasite-2019",
    title: "Parasite",
    year: 2019,
    imdb: 8.5,
    rt: 99,
    initialVotes: 133,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/SEUXfv87Wpk",
    trailerWatchUrl: "https://www.youtube.com/watch?v=SEUXfv87Wpk",
  },
  {
    id: "interstellar-2014",
    title: "Interstellar",
    year: 2014,
    imdb: 8.7,
    rt: 73,
    initialVotes: 87,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/zSWdZVtXT7E",
    trailerWatchUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
  },
  {
    id: "spider-verse-2018",
    title: "Spider-Man: Into the Spider-Verse",
    year: 2018,
    imdb: 8.4,
    rt: 97,
    initialVotes: 121,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/g4Hbz2jLxvQ",
    trailerWatchUrl: "https://www.youtube.com/watch?v=g4Hbz2jLxvQ",
  },
  {
    id: "mad-max-fury-road-2015",
    title: "Mad Max: Fury Road",
    year: 2015,
    imdb: 8.1,
    rt: 90,
    initialVotes: 96,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/hEJnMQG9ev8",
    trailerWatchUrl: "https://www.youtube.com/watch?v=hEJnMQG9ev8",
  },
  {
    id: "back-to-the-future-1985",
    title: "Back to the Future",
    year: 1985,
    imdb: 8.5,
    rt: 93,
    initialVotes: 117,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/vN5B5WgYscRGcQpVhHl6p9DDTP0.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/qvsgGtivCgs",
    trailerWatchUrl: "https://www.youtube.com/watch?v=qvsgGtivCgs",
  },
  {
    id: "everything-everywhere-2022",
    title: "Everything Everywhere All at Once",
    year: 2022,
    imdb: 7.8,
    rt: 93,
    initialVotes: 109,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/u68AjlvlutfEIcpmbYpKcdi09ut.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/wxN1T1uxQ2g",
    trailerWatchUrl: "https://www.youtube.com/watch?v=wxN1T1uxQ2g",
  },
  {
    id: "knives-out-2019",
    title: "Knives Out",
    year: 2019,
    imdb: 7.9,
    rt: 97,
    initialVotes: 83,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/qGqiHJTsRkQ",
    trailerWatchUrl: "https://www.youtube.com/watch?v=qGqiHJTsRkQ",
  },
  {
    id: "dune-part-two-2024",
    title: "Dune: Part Two",
    year: 2024,
    imdb: 8.5,
    rt: 92,
    initialVotes: 99,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    trailerWatchUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
  },
  {
    id: "arrival-2016",
    title: "Arrival",
    year: 2016,
    imdb: 7.9,
    rt: 94,
    initialVotes: 78,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/tFMo3UJ4B4g",
    trailerWatchUrl: "https://www.youtube.com/watch?v=tFMo3UJ4B4g",
  },
  {
    id: "grand-budapest-2014",
    title: "The Grand Budapest Hotel",
    year: 2014,
    imdb: 8.1,
    rt: 92,
    initialVotes: 74,
    posterUrl:
      "https://media.themoviedb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    trailerEmbedUrl: "https://www.youtube.com/embed/1Fg5iWmQjwk",
    trailerWatchUrl: "https://www.youtube.com/watch?v=1Fg5iWmQjwk",
  },
];
