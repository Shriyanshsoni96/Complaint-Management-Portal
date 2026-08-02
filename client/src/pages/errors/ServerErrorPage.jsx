import ErrorPageLayout from '../../components/common/ErrorPageLayout.jsx';

function ServerErrorPage() {
  return (
    <ErrorPageLayout
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred on our end. Please try again in a moment."
    />
  );
}

export default ServerErrorPage;
