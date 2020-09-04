import React from "react";
import Spinner from "react-bootstrap/Spinner";

function Loading() {
  return <div className="loading-screen">
    <Spinner variant='primary' size='lg' animation="border" />
  </div>
}

export default Loading;