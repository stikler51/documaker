import ProgressBar from 'react-bootstrap/ProgressBar';
import React, {useState} from "react";
import styles from '../styles/progress.module.scss';
import Button from 'react-bootstrap/Button';
import Arrow from '../static/arrow.svg';

const Progress = (props) => {
  let numberOfFields = 0;
  let numberOfFilledFields = 0;
  const [openSidebar, setOpenSidebar] = useState(false);
  //
  // console.log(props.allFields);

  for (let key in props.allFields) {
    if (props.allFields[key] && props.allFields[key].length) {
      numberOfFilledFields++;
    }
    numberOfFields++;
  }

  return <div className="progress-block">
    <div className={styles.progressStatus}>
      <span className={styles.label}>{props.lang == 'ru' ? "Прогресс:" : props.lang == 'en' ? 'Progress:' : 'Edusammud:'}</span>
      <span className={styles.percent}>
        {Math.ceil(100 * numberOfFilledFields / numberOfFields) || 0} %
      </span>
    </div>
    <ProgressBar className={styles.progress} max={100} variant="success" now={Math.ceil(100 * numberOfFilledFields / numberOfFields)} />
    <Button onClick={() => {
      props.btnHandler();
      setOpenSidebar(!openSidebar);
    }}
            className={`${styles.openSidePanel} ${openSidebar ? styles.opened : ''}`}><Arrow /></Button>
  </div>
}

export default Progress;