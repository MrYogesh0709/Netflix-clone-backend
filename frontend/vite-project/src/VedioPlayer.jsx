/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import '@videojs/http-streaming';
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ videoUrl, resolutions }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        responsive: true,
        aspectRatio: '16:9',
        html5: {
          vhs: { overrideNative: true },
        },
        sources: [
          {
            src: videoUrl,
            type: 'application/x-mpegURL',
          },
        ],
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl]);

  const changeResolution = (res) => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.currentTime();
    const isPlaying = !playerRef.current.paused();
    const newSrc = res === 'auto' ? videoUrl : videoUrl.replace('master.m3u8', `${res}.m3u8`);

    playerRef.current.src({ src: newSrc, type: 'application/x-mpegURL' });
    playerRef.current.one('loadedmetadata', () => {
      playerRef.current.currentTime(currentTime);
      if (isPlaying) playerRef.current.play();
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#000' }}>
      <div ref={videoRef} className="video-js vjs-big-play-centered" style={{ width: '100%', height: '100%' }} />
      <div className="resolution-selector" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 2 }}>
        <select
          onChange={(e) => changeResolution(e.target.value)}
          style={{ background: '#000', color: '#fff', border: '1px solid #fff', padding: '5px' }}
        >
          <option value="auto">Auto</option>
          {resolutions.map((res) => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default VideoPlayer;
