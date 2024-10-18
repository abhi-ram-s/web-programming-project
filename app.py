from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room
import random

app = Flask(__name__)
socketio = SocketIO(app)

users = {}  # To store user connections

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def handle_join():
    user_id = random.randint(1000, 9999)
    if len(users) % 2 == 0:  # If even number, create a new pair
        users[user_id] = None
        emit('waiting', 'Waiting for another user to join...')
    else:
        for uid in users:
            if users[uid] is None:
                users[uid] = user_id
                users[user_id] = uid
                room = f'room-{uid}-{user_id}'
                join_room(room)
                emit('connect_users', {'room': room}, room=room)
                break

@socketio.on('disconnect')
def handle_disconnect():
    for uid in users:
        if users[uid] is None:
            del users[uid]
            break

if __name__ == '__main__':
    socketio.run(app, debug=True)
