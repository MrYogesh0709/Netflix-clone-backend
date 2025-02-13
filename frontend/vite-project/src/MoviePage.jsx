/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import VideoPlayer from './VedioPlayer';

const MoviePage = ({ movieId }) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3000/movies/${movieId}`)
      .then((res) => res.json())
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, [movieId]);
  if (loading) return <p>Loading...</p>;
  if (!movie) return <p>Movie not found.</p>;
  return (
    <div>
      <h1>{movie.title}</h1>
      <VideoPlayer videoUrl={movie.videoUrl} resolutions={movie.resolution} />
    </div>
  );
};

export default MoviePage;
