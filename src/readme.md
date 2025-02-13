# HLS Video Streaming Guide

## 1. Overview

This guide explains how to generate HLS (HTTP Live Streaming) files using `ffmpeg` and create a master playlist for adaptive bitrate streaming.

---

## 2. HLS Conversion Command

```bash
mkdir -p videos/movie123/{240p,360p,480p,720p,1080p,1440p,2160p}

ffmpeg -i bigbuckbunny.webm \
 -preset fast -crf 20 -g 48 -keyint_min 48 -sc_threshold 0 -hls_flags independent_segments \
 -map 0:v:0 -map 0:a:0 -c:v libx264 -c:a aac -ac 2 -ar 48000 -b:a 128k \
 -hls_time 6 -hls_playlist_type vod \
 \
 -b:v 400k -s 426x240 -maxrate 480k -bufsize 800k \
 -hls_segment_filename "videos/movie123/240p/240p_%03d.ts" \
 -f hls "videos/movie123/240p/240p.m3u8" \
 \
 -b:v 800k -s 640x360 -maxrate 960k -bufsize 1200k \
 -hls_segment_filename "videos/movie123/360p/360p_%03d.ts" \
 -f hls "videos/movie123/360p/360p.m3u8" \
 \
 -b:v 1400k -s 854x480 -maxrate 1680k -bufsize 2100k \
 -hls_segment_filename "videos/movie123/480p/480p_%03d.ts" \
 -f hls "videos/movie123/480p/480p.m3u8" \
 \
 -b:v 2800k -s 1280x720 -maxrate 3360k -bufsize 4200k \
 -hls_segment_filename "videos/movie123/720p/720p_%03d.ts" \
 -f hls "videos/movie123/720p/720p.m3u8" \
 \
 -b:v 5000k -s 1920x1080 -maxrate 6000k -bufsize 7500k \
 -hls_segment_filename "videos/movie123/1080p/1080p_%03d.ts" \
 -f hls "videos/movie123/1080p/1080p.m3u8" \
 \
 -b:v 10000k -s 2560x1440 -maxrate 12000k -bufsize 15000k \
 -hls_segment_filename "videos/movie123/1440p/1440p_%03d.ts" \
 -f hls "videos/movie123/1440p/1440p.m3u8" \
 \
 -b:v 20000k -s 3840x2160 -maxrate 24000k -bufsize 30000k \
 -hls_segment_filename "videos/movie123/2160p/2160p_%03d.ts" \
 -f hls "videos/movie123/2160p/2160p.m3u8"
```

### Explanation of Parameters:

- `mkdir -p`: Creates directories for each resolution.
- `-preset fast`: Optimizes for encoding speed.
- `-crf 20`: Constant rate factor for quality.
- `-g 48`, `-keyint_min 48`: Controls keyframes for seeking.
- `-map 0:v:0 -map 0:a:0`: Maps video and audio streams.
- `-c:v libx264 -c:a aac`: Uses H.264 for video and AAC for audio.
- `-hls_time 6`: Sets segment duration to 6 seconds.
- `-hls_flags independent_segments`: Ensures each segment starts with a keyframe.

---

## 3. Master Playlist

```bash
cat <<EOF > videos/movie123/master.m3u8
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240,CODECS="avc1.42e01e,mp4a.40.2"
240p/240p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.4d401e,mp4a.40.2"
360p/360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480,CODECS="avc1.4d401f,mp4a.40.2"
480p/480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"
720p/720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=10000000,RESOLUTION=2560x1440,CODECS="avc1.640032,mp4a.40.2"
1440p/1440p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=20000000,RESOLUTION=3840x2160,CODECS="avc1.640033,mp4a.40.2"
2160p/2160p.m3u8
EOF
```

### Explanation of Master Playlist:

- `#EXTM3U`: M3U8 playlist header.
- `#EXT-X-STREAM-INF`: Declares a variant stream.
  - `BANDWIDTH`: Specifies average bitrate.
  - `RESOLUTION`: Provides resolution info.
  - `CODECS`: Lists video and audio codecs.
- Links to variant playlists for each resolution.

---

## 4. File Structure Example

```
videos/
└── movie123/
    ├── 240p/
    │   ├── 240p_000.ts
    │   └── 240p.m3u8
    ├── 360p/
    │   └── 360p.m3u8
    ├── 480p/
    │   └── 480p.m3u8
    ├── 720p/
    │   └── 720p.m3u8
    ├── 1080p/
    │   └── 1080p.m3u8
    ├── 1440p/
    │   └── 1440p.m3u8
    ├── 2160p/
    │   └── 2160p.m3u8
    └── master.m3u8
```

- `*.ts`: HLS video segments.
- `*.m3u8`: HLS playlists.
- `master.m3u8`: Master playlist for ABR.

---

## 🎉 All Set! Deploy these files to a server or CDN to stream your video using HLS.
