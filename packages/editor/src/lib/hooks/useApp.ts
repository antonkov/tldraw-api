import React from 'react'
import { App } from '../app/App'

export const AppContext = React.createContext({} as App)

/** @public */
export const useApp = (): App => {
	return React.useContext(AppContext)
}
