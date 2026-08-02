import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';

function ErrorIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 160"
      className="h-40 w-48"
      fill="none"
    >
      <rect x="10" y="20" width="180" height="120" rx="16" className="fill-blue-50 dark:fill-blue-500/10" />
      <circle cx="70" cy="75" r="9" className="fill-gray-400 dark:fill-gray-600" />
      <circle cx="130" cy="75" r="9" className="fill-gray-400 dark:fill-gray-600" />
      <path
        d="M75 108q25 -18 50 0"
        strokeWidth="6"
        strokeLinecap="round"
        className="stroke-gray-400 dark:stroke-gray-600"
        fill="none"
      />
    </svg>
  );
}

function ErrorPageLayout({ code, title, message }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-950">
      <ErrorIllustration />
      <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">{code}</h1>
      <p className="mt-1 text-lg font-medium text-gray-700 dark:text-gray-300">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Link to="/" className="mt-6">
        <Button>Go back home</Button>
      </Link>
    </div>
  );
}

export default ErrorPageLayout;
