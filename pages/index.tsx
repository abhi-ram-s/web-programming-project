import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { RtmChannel } from "agora-rtm-sdk";
import {
  ICameraVideoTrack,
  IRemoteVideoTrack,
  IAgoraRTCClient,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

type TCreateRoomResponse = {
  room: Room;
  rtcToken: string;
  rtmToken: string;
};

type TGetRandomRoomResponse = {
  rtcToken: string;
  rtmToken: string;
  rooms: Room[];
};

type Room = {
  _id: string;
  status: string;
};

type TMessage = {
  userId: string;
  message: string | undefined;
};

function createRoom(userId: string): Promise<TCreateRoomResponse> {
  return fetch(`/api/rooms?userId=${userId}`, {
    method: "POST",
  }).then((response) => response.json());
}

function getRandomRoom(userId: string): Promise<TGetRandomRoomResponse> {
  return fetch(`/api/rooms?userId=${userId}`).then((response) =>
    response.json()
  );
}

function setRoomToWaiting(roomId: string) {
  return fetch(`/api/rooms/${roomId}`, { method: "PUT" }).then((response) =>
    response.json()
  );
}

export const VideoPlayer = ({
  videoTrack,
  style,
}: {
  videoTrack: IRemoteVideoTrack | ICameraVideoTrack;
  style: object;
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const playerRef = ref.current;
    if (!videoTrack) return;
    if (!playerRef) return;

    videoTrack.play(playerRef);

    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);

  return <div ref={ref} style={style}></div>;
};

async function connectToAgoraRtc(
  roomId: string,
  userId: string,
  onVideoConnect: any,
  onWebcamStart: any,
  onAudioConnect: any,
  token: string
) {
  const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

  const client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8",
  });

  await client.join(
    process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    roomId,
    token,
    userId
  );

  client.on("user-published", (themUser, mediaType) => {
    client.subscribe(themUser, mediaType).then(() => {
      if (mediaType === "video") {
        onVideoConnect(themUser.videoTrack);
      }
      if (mediaType === "audio") {
        onAudioConnect(themUser.audioTrack);
        themUser.audioTrack?.play();
      }
    });
  });

  const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  onWebcamStart(tracks[1]);
  await client.publish(tracks);

  return { tracks, client };
}

async function connectToAgoraRtm(
  roomId: string,
  userId: string,
  onMessage: (message: TMessage) => void,
  token: string
) {
  const { default: AgoraRTM } = await import("agora-rtm-sdk");
  const client = AgoraRTM.createInstance(process.env.NEXT_PUBLIC_AGORA_APP_ID!);
  await client.login({
    uid: userId,
    token,
  });
  const channel = await client.createChannel(roomId);
  await channel.join();
  channel.on("ChannelMessage", (message, userId) => {
    onMessage({
      userId,
      message: message.text,
    });
  });

  return {
    channel,
  };
}

export default function Home() {
  const [userId] = useState(parseInt(`${Math.random() * 1e6}`) + "");
  const [room, setRoom] = useState<Room | undefined>();
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [input, setInput] = useState("");
  const [themVideo, setThemVideo] = useState<IRemoteVideoTrack>();
  const [myVideo, setMyVideo] = useState<ICameraVideoTrack>();
  const [themAudio, setThemAudio] = useState<IRemoteAudioTrack>();
  const channelRef = useRef<RtmChannel>();
  const rtcClientRef = useRef<IAgoraRTCClient>();
  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank'];
  const [randomName, setRandomName] = useState('');

  const generateRandomName = () => {
    const name = names[Math.floor(Math.random() * names.length)];
    setRandomName(name);
  };

  function handleNextClick() {
    connectToARoom();
    generateRandomName();
  }

  function handleStartChattingClicked() {
    connectToARoom();
    generateRandomName();
  }

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault();
    await channelRef.current?.sendMessage({
      text: input,
    });
    setMessages((cur) => [
      ...cur,
      {
        userId,
        message: input,
      },
    ]);
    setInput("");
  }

  async function connectToARoom() {
    setThemAudio(undefined);
    setThemVideo(undefined);
    setMyVideo(undefined);
    setMessages([]);

    if (channelRef.current) {
      await channelRef.current.leave();
    }

    if (rtcClientRef.current) {
      rtcClientRef.current.leave();
    }

    const { rooms, rtcToken, rtmToken } = await getRandomRoom(userId);

    if (room) {
      setRoomToWaiting(room._id);
    }

    if (rooms.length > 0) {
      setRoom(rooms[0]);
      const { channel } = await connectToAgoraRtm(
        rooms[0]._id,
        userId,
        (message: TMessage) => setMessages((cur) => [...cur, message]),
        rtmToken
      );
      channelRef.current = channel;

      const { tracks, client } = await connectToAgoraRtc(
        rooms[0]._id,
        userId,
        (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
        (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
        (themAudio: IRemoteAudioTrack) => setThemAudio(themAudio),
        rtcToken
      );
      rtcClientRef.current = client;
    } else {
      const { room, rtcToken, rtmToken } = await createRoom(userId);
      setRoom(room);
      const { channel } = await connectToAgoraRtm(
        room._id,
        userId,
        (message: TMessage) => setMessages((cur) => [...cur, message]),
        rtmToken
      );
      channelRef.current = channel;

      const { tracks, client } = await connectToAgoraRtc(
        room._id,
        userId,
        (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
        (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
        (themAudio: IRemoteAudioTrack) => setThemAudio(themAudio),
        rtcToken
      );
      rtcClientRef.current = client;
    }
  }

  function convertToYouThem(message: TMessage) {
    return message.userId === userId ? "You" : "Them";
  }

  const isChatting = room!!;

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
<main className={styles.main}>
  {isChatting ? (
    <>
      <div className="header-container">
        <h1>Random.io</h1>
        <h2>
          Random.io is a platform for spontaneous, anonymous chats with people around the world. 
          Connect instantly, meet new friends, and enjoy unique conversations with just a click. 
          Dive into the randomness and start chatting now!
        </h2>
      </div>

      <button
        id="newstyle"
        onClick={handleNextClick}
        style={{
          width: '50px',
          height: '30px',
          color: 'rgb(225, 234, 235)',
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
      >
        Next
      </button>

      <div className="chat-window" style={{ display: 'flex' }}>
        <div className="video-panel" style={{ flex: 1, marginRight: '20px' }}>
          {/* Video stream for the user with the name above */}
          <div className="video-stream" style={{ marginBottom: '20px' }}>
            <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>
              User Name: {randomName}
            </p>
            {myVideo && (
              <VideoPlayer
                style={{ width: '100%', height: '100%' }}
                videoTrack={myVideo}
              />
            )}
          </div>

          {/* Video stream for the connected user with their name above */}
          <div className="video-stream">
            <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>
              Connected User
            </p>
            {themVideo && (
              <VideoPlayer
                style={{ width: '100%', height: '100%' }}
                videoTrack={themVideo}
              />
            )}
          </div>
        </div>

        {/* Right-hand side chat panel with increased width */}
        <div className="chat-panel" style={{ flex: 2, border: '1px solid #ccc', padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
          <ul>
            {messages.map((message, idx) => (
              <li key={idx}>
                {convertToYouThem(message)} - {message.message}
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmitMessage} style={{ marginTop: '20px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ width: '80%', padding: '10px', marginRight: '10px' }}
            />
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="header-container">
        <h1>Random.io</h1>
        <h2>
          Random.io is a platform for spontaneous, anonymous chats with people around the world. 
          Connect instantly, meet new friends, and enjoy unique conversations with just a click. 
          Dive into the randomness and start chatting now!
        </h2>
      </div>
      <button
        id="newstyle"
        onClick={handleStartChattingClicked}
        style={{
          width: '240px',
          height: '60px',
          color: 'rgb(225, 234, 235)',
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
      >
        Start Chatting
      </button>
    </>
  )}
</main>

    </>
  );
}

