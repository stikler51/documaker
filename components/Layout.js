import React, {useState, useRef} from "react";
import Head from "../components/head";
import Logo from "../static/Logo.svg";
import {Container, Button} from "react-bootstrap";
import ErrorScreen from "./Error";
import Link from "next/link";
import RuIcon from '../static/ru.svg';
import EnIcon from '../static/en.svg';
import EtIcon from '../static/est.svg';
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from 'react-bootstrap/DropdownButton';
import PrivacyIcon from '../static/privacy.svg';
import SupportIcon from '../static/support.svg';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import InputGroup from 'react-bootstrap/InputGroup';
import SearchIcon from '../static/search.svg';
import CloseIcon from '../static/close.svg';

function Layout(props) {
  let options = [
    { value: 'ru', label: <RuIcon />, labelText: 'Рус' },
    { value: 'en', label: <EnIcon />, labelText: 'Eng'},
    { value: 'et', label: <EtIcon />, labelText: 'Eesti' },
  ];

  let defaultLang = options.filter(lang => {
    if (lang.value === props.lang){
      return lang;
    }
  })

  const ref = useRef();
  const search = useRef();

  let [language, changeLanguage] = useState(defaultLang[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [searchOpened, setSearchOpened] = useState(false);


  async function handleSearch(val) {
    setIsLoading(true);
    const docs = await fetch(`http://sandbox.webbro.pro/api/short_docs?title=${val}&lang=all`)
    let findedDocs = await docs.json();
    setDocuments(findedDocs);
    setIsLoading(false);
  }


  return <div className={props.className}>
    <Head/>
    <header className="header">
      <Container>
        <div className="logoWrapper">
          <Button
            style={{background: 'transparent', border: 'none', marginRight: '5px', width: '40px', boxShadow: 'none'}}
            variant="light"
            onClick={() => {
              setSearchOpened(!searchOpened);
            }}
          >
            {searchOpened ? <CloseIcon /> : <SearchIcon />}
          </Button>
          <Link href="/">
            <a style={{textDecoration: 'none'}}>
              <div className="logo">
                <Logo/>
                Dokumendi<span>Baas</span>
              </div>
            </a>
          </Link>
        </div>


        <div className={`${searchOpened ? 'searchBlock active' : 'searchBlock '}`} ref={search}>
          <InputGroup>
            <InputGroup.Prepend>
              <SearchIcon />
            </InputGroup.Prepend>

            <AsyncTypeahead
              id="async-example"
              isLoading={isLoading}
              minLength={3}
              onSearch={handleSearch}
              labelKey="title"
              options={documents}
              placeholder={props.lang == 'ru' ? "Поиск по базе документов" : props.lang == 'en' ? 'Search in the document base' : 'Otsige dokumendibaasist'}
              ref={ref}
              onChange={(val)=> {
                if (val.length) {
                  let lang = ''
                  let langcode = val[0].langcode;
                  if (langcode == 'Estonian') {
                    lang = 'et'
                  } else if (langcode == 'English') {
                    lang = 'en'
                  } else {
                    lang = 'ru'
                  }

                  props.changeLang(lang);

                  window.open(`/${val[0].slug}`, '_blank').focus();
                }

              }}
              renderMenuItemChildren={(option, props) => (
                <p href={`/${option.slug}`} title={option.title}><span className="title">{option.title}</span> <span className="category">{option.category.name}</span></p>
              )}
            />
            <InputGroup.Append>
              {documents.length ? <CloseIcon onClick={() => {
                ref.current.clear();
                setDocuments([]);
              }} /> : ''}
            </InputGroup.Append>

          </InputGroup>

        </div>


        <div className="staticPagesLinks">
          <Link href="/contact" as="contact">
            <a><SupportIcon style={{marginRight: '12px'}}/>{props.lang == 'ru' ? " Обратная связь" : props.lang == 'en' ? ' Contact Us' : ' Tagasiside'}</a>
          </Link>
          <Link href="/confidential" as="confidential">
            <a style={{marginLeft: '30px'}}><PrivacyIcon style={{marginRight: '12px'}}/>{props.lang == 'ru' ? " Конфиденциальность" : props.lang == 'en' ? ' Confidentiality' : ' Konfidentsiaalsus'}</a>
          </Link>
        </div>

        <div className="lang">
          <DropdownButton className='langSelector'
                          id='langSelector'
                          title={language.label}>
            {options.map(l => {
              if (l.value !== language.value) {
                return <Dropdown.Item
                  key={l.value}
                  onClick={() => {
                    props.changeLang(l.value);
                    changeLanguage({value: l.value, label: l.label});
                  }}
                  as="button">{l.label} {l.labelText}</Dropdown.Item>
              }
            })}
          </DropdownButton>
        </div>
      </Container>
    </header>
    {props.error ? <ErrorScreen text={props.error}/>
    : <main>
        <Container>
          {props.children}
        </Container>
      </main>
    }

    <footer className="footer">
      <Container>
        <p>© {new Date().getFullYear()} DokumendiBaas</p>
        <div>
          <Link href="/confidential" as="confidential">
            <a>{props.lang == 'ru' ? "Конфиденциальность" : props.lang == 'en' ? 'Confidentiality' : 'Konfidentsiaalsus'}</a>
          </Link>
          <Link href="/contact" as="contact">
            <a style={{marginLeft: '30px'}}>{props.lang == 'ru' ? "Обратная связь" : props.lang == 'en' ? 'Contact Us' : 'Tagasiside'}</a>
          </Link>
        </div>
      </Container>
    </footer>


  </div>
}

export default Layout;