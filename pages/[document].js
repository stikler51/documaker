import React from "react";
import DocForm from "../components/DocForm";
import Layout from "../components/Layout";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class DocumentPage extends React.Component {
    constructor(props) {
        super(props);
        this.replaceTokens = this.replaceTokens.bind(this);

        this.state = {
            doc: this.props.data[0].doc
        }
    }

    replaceTokens(tokens) {
        let initialText = this.props.data[0].doc;

        for (let key in tokens) {
            if (tokens[key].length) {
                let str1 = `{{${key}}}`
                var re = new RegExp(str1, "g");
                initialText = initialText.replace(re, tokens[key]);
            }
        }

        this.setState({
            doc: initialText
        })

    }

    render() {
        return (
            <Layout>
                <Row>
                    <Col sm={8}>
                        <DocForm changeHandler={this.replaceTokens}
                                 schema={this.props.objSchema}
                                 title={this.props.data[0].title}
                                 body={this.props.data[0].body}
                                 js={this.props.data[0].js}
                        />
                    </Col>

                    <Col sm={4}>
                        <div className="doc" dangerouslySetInnerHTML={{__html: this.state.doc}}></div>
                    </Col>
                </Row>
            </Layout>
        );
    }
}


export async function getServerSideProps(props) {
    let documentSlug = props.query.document;
    // Fetch data from external API
    const res = await fetch(`http://sandbox.webbro.pro/api/all_docs?slug=${documentSlug}`)
    const data = await res.json()
    let schema = data[0].schema;
    const objSchema = JSON.parse(schema);

    return { props: { data, objSchema } }
}

export default DocumentPage;