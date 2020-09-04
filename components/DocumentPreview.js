import React, { Component } from 'react';
import { Document, Page } from 'react-pdf';
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import cookies from "next-cookies";

class DocumentPreview extends Component {
  constructor(props) {
    super(props);

    let lang = cookies(props).lang || props.store.getState().lang;

    this.state = {
      numPages: null,
      pageNumber: 1,
      lang: lang
    }
  }

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ numPages });
  }

  render() {
    const { pageNumber, numPages } = this.state;

    return (
      <div>
        <Document
          file={`data:application/pdf;base64,${this.props.file}`}
          onLoadSuccess={this.onDocumentLoadSuccess}
          renderMode="svg"
          loading={<div style={{display: "flex", justifyContent: 'center'}}><Spinner animation="border" size="lg" variant="light"/></div>}
        >
          <Page pageNumber={pageNumber}
                scale={this.props.isMobile ? '0.45' : '1'}
                renderTextLayer={false}

          />
        </Document>
        <div className="pager">
          <Button type="button"
                  variant="light"
                  size="lg"
                  disabled={pageNumber <= 1}
                  onClick={()=>{
                    if (pageNumber > 1) {
                      this.setState({
                        pageNumber: pageNumber - 1
                      })
                    }
                  }}
          >‹</Button>
          <span>{pageNumber} {this.state.lang == 'ru' ? "из" : this.state.lang == 'en' ? 'of' : 'kohta'} {numPages}</span>
          <Button type="button"
                  variant="light"
                  size="lg"
                  disabled={pageNumber >= numPages}
                  onClick={()=>{
                    if (pageNumber < numPages) {
                      this.setState({
                        pageNumber: pageNumber + 1
                      })
                    }
                  }}
          >›</Button>
        </div>

      </div>
    );
  }
}

export default DocumentPreview;