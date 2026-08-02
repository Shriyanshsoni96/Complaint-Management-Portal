import ErrorPageLayout from '../../components/common/ErrorPageLayout.jsx';

function UnauthorizedPage() {
  return (
    <ErrorPageLayout
      code="403"
      title="Access denied"
      message="You don't have permission to view this page."
    />
  );
}

export default UnauthorizedPage;
