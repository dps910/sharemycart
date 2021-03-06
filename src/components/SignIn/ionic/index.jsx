import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'

import { withFirebase } from '../../Firebase'
import { SHOPPING, SIGN_IN } from '../../../constants/routes'
import { IonGrid, IonRow, IonCol, IonContent, IonInput, IonIcon, IonButton, IonItem, IonText } from '@ionic/react'

import { logoGoogle, logoFacebook, logoTwitter } from 'ionicons/icons'
import SplashLogo from '../../Reusables/ionic/SplashLogo'
import { PasswordForgetLink } from '../../PasswordForget/ionic'
import { SignUpLink } from '../../SignUp/ionic'

import { withTranslation, Trans } from 'react-i18next'

import '../../Reusables/sign-in-up-page.scss'
import '../../Reusables/components.scss'
import { withEmailVerification } from '../../Session'

const SignInPage = (props) => {
	const isShareRedirect = !!(props.location.state && props.location.state.from && props.location.state.from.pathname.match('^/share/'))
	return (
		<>
			<IonContent className="login-page">
				<SplashLogo maxWidth={isShareRedirect ? '100px' : '150px'} />
				{isShareRedirect && <IonItem color="success" className="permanent-message">
					<IonText><h5><Trans>Sharing_link_received</Trans></h5></IonText>
				</IonItem>}
				<IonGrid>
					<SignInForm />
					<IonRow>
						<IonCol>
							<PasswordForgetLink />
							<br />
							<SignUpLink state={props.location.state} />
						</IonCol>
					</IonRow>
					<div className="separator">
						<Trans>or with</Trans>
					</div>
					<SignInGoogle />
					{/* <SignInFacebook /> */}
					{/* <SignInTwitter /> */}
				</IonGrid>
			</IonContent>
		</>
	)
}

const INITIAL_STATE = {
	email: '',
	password: '',
	error: null,
}

const ERROR_CODE_ACCOUNT_EXISTS =
	'auth/account-exists-with-different-credential'

const ERROR_MSG_ACCOUNT_EXISTS = `
  An account with an E-Mail address to
  this social account already exists. Try to login from
  this account instead and associate your social accounts on
  your personal account page.
`

// this function defers the navigation to the referrer or to another site
// after signing in.
// this is necessary since if not deferred, the session's authUser may not be 
// available in the cache.
// It's a hack since there's no option / hook into the event which it can be hooked into
// probably, a MobX reaction in the session store could provide a hook.
const navigateIfRequested = function () {
	const { from } = this.props.location.state || { from: { pathname: '/' } }
	const { redirectToReferrer } = this.state
	const { history } = this.props
	if (redirectToReferrer === true) {
		setTimeout(() => history.push((from && from.pathname) || SHOPPING), 500)
	}
}

class SignInFormBase extends Component {
	constructor(props) {
		super(props)
		this.state = { ...INITIAL_STATE }
	}

	onSubmit = event => {
		const { email, password } = this.state

		event.preventDefault()

		this.props.firebase
			.doSignInWithEmailAndPassword(email, password)
			// .then(authUser => {

			//   // Instantiate PasswordCredential with the form
			//   if (window.PasswordCredential) {
			//     // eslint-disable-next-line no-undef
			//     var c = new PasswordCredential(event.target);
			//     return navigator.credentials.store(c);
			//   } else {
			//     return Promise.resolve(authUser);
			//   }
			// })
			.then(() => {
				this.setState({
					redirectToReferrer: true
					, ...INITIAL_STATE
				})
			})
			.catch(error => {
				this.setState({ error })
			})

	};

	onChange = event => {
		this.setState({ [event.target.name]: event.target.value })
	};

	render() {
		const { email, password, error } = this.state

		const isInvalid = password === '' || email === ''

		const { t } = this.props

		// trigger a navigation instead of rendering if necessary (after successful log-in)
		navigateIfRequested.call(this)

		return (
			<form onSubmit={this.onSubmit}>
				<IonRow>
					<IonCol>
						<IonInput
							name="email"
							value={email}
							onIonChange={this.onChange}
							clearInput
							type="email"
							placeholder={t('Email')}
							className="input"
							padding-horizontal
							clear-input="true"
							autocomplete="username email"
						>
						</IonInput>
					</IonCol>
				</IonRow>
				<IonRow>
					<IonCol>
						<IonInput
							clearInput
							name="password"
							value={password}
							onIonChange={this.onChange}
							type="password"
							placeholder={t('Password')}
							className="input"
							autocomplete="current-password"
							padding-horizontal>
						</IonInput>
					</IonCol>
				</IonRow>
				<IonButton disabled={isInvalid} type="submit" expand="block">
					<Trans>Sign In</Trans>
				</IonButton>

				{error && <p>{error.message}</p>}
			</form>
		)
	}
}

class SignInGoogleBase extends Component {
	constructor(props) {
		super(props)

		this.state = { error: null }
	}

	onSubmit = event => {
		this.props.firebase
			.doSignInWithGoogle({redirectUri: SIGN_IN ,state: this.props.location.state})
			.then(socialAuthUser => {
				//this will be passed only in case of signInWithPopup
				// Create a user in your Firebase Realtime Database too
				return this.props.firebase.user(socialAuthUser.user.uid).set({
					username: socialAuthUser.user.displayName,
					email: socialAuthUser.user.email,
					roles: {},
				},
				{ merge: true },
				)
			})
			.then(() => {
				this.setState({
					redirectToReferrer: true
					, error: null
				})
			})
			.catch(error => {
				if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
					error.message = ERROR_MSG_ACCOUNT_EXISTS
				}

				this.setState({ error })
			})

		event.preventDefault()
	};

	render() {
		const { error } = this.state

		navigateIfRequested.call(this)

		return (
			<form onSubmit={this.onSubmit}>
				<IonRow>
					<IonCol>
						<IonButton onClick={this.onSubmit} type="submit" expand="block" color="secondary"><IonIcon
							icon={logoGoogle} /><span className="social-button-text">Google</span></IonButton>
					</IonCol>
				</IonRow>
				{error && <p>{error.message}</p>}
			</form>
		)
	}
}

class SignInFacebookBase extends Component {
	constructor(props) {
		super(props)

		this.state = { error: null }
	}

	onSubmit = event => {
		this.props.firebase
			.doSignInWithFacebook()
			.then(socialAuthUser => {
				// Create a user in your Firebase Realtime Database too
				return this.props.firebase.user(socialAuthUser.user.uid).set({
					username: socialAuthUser.additionalUserInfo.profile.name,
					email: socialAuthUser.additionalUserInfo.profile.email,
					roles: {},
				},
				{ merge: true },
				)
			})
			.then(() => {
				this.setState({
					redirectToReferrer: true,
					error: null
				})
			})
			.catch(error => {
				if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
					error.message = ERROR_MSG_ACCOUNT_EXISTS
				}

				this.setState({ error })
			})

		event.preventDefault()
	};

	render() {
		const { error } = this.state

		navigateIfRequested.call(this)

		return (
			<form onSubmit={this.onSubmit}>
				<IonRow>

					<IonCol>
						<IonButton onClick={this.onSubmit} type="submit" expand="block" color="secondary"><IonIcon
							icon={logoFacebook} /><span
							className="social-button-text">Facebook</span></IonButton>
					</IonCol>
				</IonRow>

				{error && <p>{error.message}</p>}
			</form>
		)
	}
}

class SignInTwitterBase extends Component {
	constructor(props) {
		super(props)

		this.state = { error: null }
	}

	onSubmit = event => {
		this.props.firebase
			.doSignInWithTwitter()
			.then(socialAuthUser => {
				// Create a user in your Firebase Realtime Database too
				return this.props.firebase.user(socialAuthUser.user.uid).set({
					username: socialAuthUser.additionalUserInfo.profile.name,
					email: socialAuthUser.additionalUserInfo.profile.email,
					roles: {},
				},
				{ merge: true },
				)
			})
			.then(() => {
				this.setState({
					redirectToReferrer: true,
					error: null
				})
			})
			.catch(error => {
				if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
					error.message = ERROR_MSG_ACCOUNT_EXISTS
				}

				this.setState({ error })
			})

		event.preventDefault()
	};

	render() {
		const { error } = this.state

		navigateIfRequested.call(this)

		return (
			<form onSubmit={this.onSubmit}>
				<IonRow>

					<IonCol>
						<IonButton onClick={this.onSubmit} type="submit" expand="block" color="secondary"><IonIcon
							icon={logoTwitter} /><span
							className="social-button-text">Twitter</span></IonButton>
					</IonCol>
				</IonRow>

				{error && <p>{error.message}</p>}
			</form>
		)
	}
}

const SignInForm = compose(
	withRouter,
	withFirebase,
	withTranslation(),
)(SignInFormBase)

const SignInGoogle = compose(
	withRouter,
	withFirebase,
)(SignInGoogleBase)

const SignInFacebook = compose(
	withRouter,
	withFirebase,
)(SignInFacebookBase)

const SignInTwitter = compose(
	withRouter,
	withFirebase,
)(SignInTwitterBase)

export default withEmailVerification(SignInPage)

export { SignInForm, SignInGoogle, SignInFacebook, SignInTwitter }
