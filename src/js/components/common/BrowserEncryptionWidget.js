var React = require('react');
import {FlatButton, FontIcon, TextField} from 'material-ui';
import PropTypes from 'prop-types';
import {changeHandler} from 'utils/component-utils';
var sha256 = require('js-sha256').sha256;
var api = require('utils/api');
var UserStore = require('stores/UserStore');
var UserActions = require('actions/UserActions');
import connectToStores from 'alt-utils/lib/connectToStores';


@connectToStores
@changeHandler
export default class BrowserEncryptionWidget extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      form: {
        password: ''
      },
      form_showing: false
    }

    this.handleClick = this.handleClick.bind(this)
  }

  static getStores() {
    return [UserStore]
  }

  static getPropsFromStores() {
    return UserStore.getState()
  }

  clear() {
    UserActions.storeVerifiedEncryptionKey(null)
  }

  verified() {
    return this.props.user_encryption_key != null
  }

  verify() {
    let {form} = this.state
    if (form.password.length > 0) {
      let key = sha256(form.password)
      let sha = sha256(key)
      api.post("/api/user/encryption/validate_password", {encr_pw_sha: sha}, (res) => {
        this.setState({form_showing: false, form: {password: ''}}, () => {
          UserActions.storeVerifiedEncryptionKey(key)
        })
      }, (res) => {
        this.clear()
      })
    }
  }

  handleClick() {
    let {form_showing} = this.state
    if (form_showing) {
      this.verify()
    } else {
      if (this.verified()) {
        this.clear()
      } else {
        this.setState({form_showing: true})
      }
    }
  }

  render() {
    let {form_showing, form} = this.state
    let {user} = this.props
    let verified = this.verified()
    let text, icon
    if (form_showing) {
      text = "Enable"
      icon = 'check'
    } else {
      text = verified ? "Encryption enabled" : "Encryption disabled"
      icon = verified ? 'lock' : 'lock_open'
    }
    let icon_st = {
      color: verified ? 'green' : 'white'
    }
    let input
    if (form_showing) input = (
      <TextField
        name="password"
        placeholder="Encryption password"
        hidden={!form_showing}
        type="password"
        autoFocus
        onChange={this.changeHandler.bind(this, 'form', 'password')}
        value={form.password || ''} />
      )
    if (user.encryption_password_set) {
      return (
        <span>
            { input }
            <FlatButton
                label={text}
                onClick={this.handleClick}
                icon={<FontIcon className="material-icons" style={icon_st}>{icon}</FontIcon>} />
        </span>
      )
    } else {
      return null
    }
  }
}

BrowserEncryptionWidget.defaultProps = {
  user: null
}

BrowserEncryptionWidget.propTypes = {
  user: PropTypes.object
}