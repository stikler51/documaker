import React from "react";

function convert(str) {
  str = str.replace(/&amp;/g, "&");
  str = str.replace(/&gt;/g, ">");
  str = str.replace(/&lt;/g, "<");
  str = str.replace(/&quot;/g, "\"");
  str = str.replace(/&#039;/g, "'");
  return str;
}

function SvgWrapper(props) {
  let ic = convert(props.icon);
  return <div style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}>
    <div style={{marginRight: '10px'}} dangerouslySetInnerHTML={{__html: ic}} />
    {props.name}
  </div>
}

export default SvgWrapper