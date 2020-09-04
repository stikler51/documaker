import React from "react";
import Problem from '../static/problem.svg';

function ErrorScreen(props) {
  return <div className='error-screen'>
    <Problem />
    <h2>{props.text}</h2>
  </div>
}

export default ErrorScreen;