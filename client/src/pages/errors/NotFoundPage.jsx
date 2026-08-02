import ErrorPageLayout from '../../components/common/ErrorPageLayout.jsx';

function NotFoundPage() {
  return (
    <ErrorPageLayout
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
    />
  );
}

export default NotFoundPage;
