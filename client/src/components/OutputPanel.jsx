// No explicit React import needed with the new JSX transform

/**
 * OutputPanel – displays the result of the executed code.
 * UI only; does not contain any execution logic.
 */
function OutputPanel({ output }) {
  return (
    <section className="output-panel" aria-live="polite">
      <pre className="output-window">{output || 'Run code to see output here.'}</pre>
    </section>
  );
}

export default OutputPanel;