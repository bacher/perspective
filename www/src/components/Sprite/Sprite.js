import React from 'react';

import './Sprite.scss';
import state from '../../state';
import ChatMessage from '../ChatMessage';

const offsets = {};

export default function Sprite({ data }) {
  const { type, position, chatMessage, isFixed } = data;

  const pos = state.getScreenCoords(position, isFixed);

  const offset = offsets[type] || { x: 16, y: 24 };

  return (
    <i
      className="sprite"
      style={{
        top: pos.y - offset.y,
        left: pos.x - offset.x,
      }}
    >
      <img className="sprite__img" alt="" src={`assets/sprites/${type}.png`} />
      {chatMessage ? <ChatMessage chatMessage={chatMessage} /> : null}
    </i>
  );
}
