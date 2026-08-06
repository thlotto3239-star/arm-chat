function Error({ statusCode }: { statusCode?: number }) {
  return (
    <p style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      {statusCode
        ? `An error ${statusCode} occurred on server`
        : 'An error occurred on client'}
    </p>
  );
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode?: number }; err?: { statusCode?: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 444;
  return { statusCode };
};

export default Error;
