import React from "react";
import Link from 'next/link';
import Layout from "../components/Layout";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class MainPage extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <Layout>
                <Row>
                    <Col sm={8}>
                      <div className='form-block'>
                        <ul>
                          {this.props.data.map(doc => {
                            return <li>
                              <Link href="/[slug]" as={`/${doc.slug}`}>
                                <a>{doc.title}</a>
                              </Link>
                            </li>
                          })}
                        </ul>
                      </div>

                    </Col>

                    <Col sm={4}>

                    </Col>
                </Row>
            </Layout>
        );
    }
}


export async function getServerSideProps() {
    // Fetch data from external API
    const res = await fetch(`http://sandbox.webbro.pro/api/short_docs`)
    const data = await res.json();
    return { props: { data } }
}

export default MainPage;