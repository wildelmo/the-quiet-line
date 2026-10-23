// Keep leaving independent of rendering, asset loading, or XR shutdown success.
export function createExitAction({ getSession, stop, dispose, closePage, leavePage, schedule = setTimeout, cancel = clearTimeout }) {
  let exiting = false;
  return function exit() {
    if (exiting) return;
    exiting = true;
    try { stop(); } catch { /* Navigation must still work after a graphics error. */ }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancel(deadline);
      try { dispose(); } catch { /* Unloading the document releases the rest. */ }
      // Browsers can refuse window.close() for a user-opened tab. Replacing the
      // document with about:blank unloads the app instead of leaving it running.
      schedule(leavePage, 100);
      try { closePage(); } catch { /* The blank-page fallback remains scheduled. */ }
    };
    const deadline = schedule(finish, 1500);
    try {
      const session = getSession();
      if (session) Promise.resolve(session.end()).then(finish, finish);
      else finish();
    } catch { finish(); }
  };
}
