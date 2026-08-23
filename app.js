// Lifeline — bootstrap script
// Mounts the React component tree defined in App.jsx (exposed as
// window.LifelineApp) into the #root div. Kept separate from the
// component definitions so the "plain JS" wiring is easy to find.

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(window.LifelineApp));
