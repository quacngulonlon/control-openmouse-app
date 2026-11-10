import React from 'react';

export const SmallScreenBlocker: React.FC = () => {
  return (
    <section className="small-screen-blocker">
      <img src="./logo.png" alt="" width="28" height="42" className="standalone-brand" />
      <h1>Make the window bigger.</h1>
      <p>
        OpenMouse lays its device controls out side by side and needs at least 900 × 600 pixels. Resize the window, or move to a larger display.
      </p>
    </section>
  );
};
