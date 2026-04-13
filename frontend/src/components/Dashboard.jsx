import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://192.168.1.19:3001');

export default function Dashboard() {
    const [scores, setScores] = useState([]);

    useEffect(() => {
        socket.on('update_score', (data) => setScores(data));
        return () => socket.off('update_score');
    }, []);

    return (
        <div>
            <h1>Hasil Real-Time</h1>
            {scores.map(s => <p key={s.id}>Kandidat {s.id}: {s.jumlah_suara} suara</p>)}
        </div>
    );
}