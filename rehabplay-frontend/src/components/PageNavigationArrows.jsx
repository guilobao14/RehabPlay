import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BACK_KEY = "rehabplay_back_stack";
const FORWARD_KEY = "rehabplay_forward_stack";
const BLOCKED = ["/", "/login", "/register"];

function readStack(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function cleanStack(stack) {
  return stack.filter((path) => path && !BLOCKED.includes(path));
}

function saveStack(key, value) {
  const cleaned = cleanStack(value);
  sessionStorage.setItem(key, JSON.stringify(cleaned));
  return cleaned;
}

export default function PageNavigationArrows() {
  const navigate = useNavigate();
  const location = useLocation();

  const [backStack, setBackStack] = useState(() => readStack(BACK_KEY));
  const [forwardStack, setForwardStack] = useState(() => readStack(FORWARD_KEY));

  useEffect(() => {
    const currentPath = location.pathname;

    if (BLOCKED.includes(currentPath)) return;

    const currentBack = readStack(BACK_KEY);
    const last = currentBack[currentBack.length - 1];

    if (last !== currentPath) {
      const updatedBack = saveStack(
        BACK_KEY,
        [...currentBack, currentPath].slice(-30)
      );

      const updatedForward = saveStack(FORWARD_KEY, []);

      setBackStack(updatedBack);
      setForwardStack(updatedForward);
    } else {
      setBackStack(cleanStack(currentBack));
      setForwardStack(cleanStack(readStack(FORWARD_KEY)));
    }
  }, [location.pathname]);

  const canGoBack = backStack.length > 1;
  const canGoForward = forwardStack.length > 0;

  function handleBack() {
    const currentBack = readStack(BACK_KEY);
    const currentForward = readStack(FORWARD_KEY);

    if (currentBack.length <= 1) return;

    const current = currentBack.pop();
    const previous = currentBack[currentBack.length - 1];

    const updatedBack = saveStack(BACK_KEY, currentBack);
    const updatedForward = saveStack(FORWARD_KEY, [current, ...currentForward]);

    setBackStack(updatedBack);
    setForwardStack(updatedForward);

    navigate(previous, { replace: true });
  }

  function handleForward() {
    const currentBack = readStack(BACK_KEY);
    const currentForward = readStack(FORWARD_KEY);

    if (!currentForward.length) return;

    const next = currentForward.shift();

    const updatedBack = saveStack(BACK_KEY, [...currentBack, next]);
    const updatedForward = saveStack(FORWARD_KEY, currentForward);

    setBackStack(updatedBack);
    setForwardStack(updatedForward);

    navigate(next, { replace: true });
  }

  return (
    <div className="pageNavArrows">
      <button type="button" onClick={handleBack} disabled={!canGoBack}>
        ←
      </button>

      <button type="button" onClick={handleForward} disabled={!canGoForward}>
        →
      </button>
    </div>
  );
}