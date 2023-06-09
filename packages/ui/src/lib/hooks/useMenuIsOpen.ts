import { useApp } from '@tldraw/editor'
import { useCallback, useEffect, useRef } from 'react'

/** @public */
export function useMenuIsOpen(id: string, cb?: (isOpen: boolean) => void) {
	const app = useApp()
	const rIsOpen = useRef(false)

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			rIsOpen.current = isOpen
			if (isOpen) {
				app.complete()
				app.openMenus.add(id)
			} else {
				app.openMenus.delete(id)
				app.openMenus.forEach((menuId) => {
					if (menuId.startsWith(id)) {
						app.openMenus.delete(menuId)
					}
				})
			}

			cb?.(isOpen)
		},
		[app, id, cb]
	)

	useEffect(() => {
		// When the effect runs, if the menu is open then
		// add it to the open menus list.

		// This is necessary for cases where the user closes
		// the parent of a submenu before closing the submenu.
		// There is some duplication between this and `onOpenChange`
		// hook but it's necessary to handle the case where the
		// this effect runs twice or re-runs.
		if (rIsOpen.current) {
			app.openMenus.add(id)
		}

		return () => {
			if (rIsOpen.current) {
				// Close menu on unmount
				app.openMenus.delete(id)

				// Close menu and all submenus when the parent is closed
				app.openMenus.forEach((menuId) => {
					if (menuId.startsWith(id)) {
						app.openMenus.delete(menuId)
					}
				})

				rIsOpen.current = false
			}
		}
	}, [app, id])

	return onOpenChange
}
