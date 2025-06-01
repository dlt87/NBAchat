const socket = io("https://nbachat.onrender.com");
const video = document.getElementById('video');
const streamUrl = 'YOUR_M3U8_STREAM_HERE';

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(streamUrl);
  hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = streamUrl;
}

const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

function sendMessage() {
  const msg = input.value.trim();
  if (msg !== '') {
    socket.emit('chat message', msg);
    input.value = '';
  }
}

socket.on('chat message', msg => {
  const el = document.createElement('div');
  el.textContent = msg;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
});
