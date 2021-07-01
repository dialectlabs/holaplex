import React from "react";
import { StorefrontTheme, Storefront } from "./types";
 
export async function checkStorefrontAvailability(subdomain: string, dispatch: React.Dispatch<any>) {
  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

   try {
    const response = await fetch(`/api/storefronts/${subdomain}`, requestOptions);

    if (response.ok) {
      dispatch({
        type: 'UPDATE_SUBDOMAIN_AVAILABILITY',
        payload: {
          available: false,
        },
      })

      return
    }

    dispatch({
      type: 'UPDATE_SUBDOMAIN_AVAILABILITY',
      payload: {
        available: true,
      },
    })

   } catch (error) {
     dispatch({ type: 'UPDATE_SUBDOMAIN_AVAILABILITY', payload: { error }})
   }

}
export async function createStorefront(subdomain: string, dispatch: React.Dispatch<any>) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subdomain })
  };
  try {
    const response = await fetch(`/api/storefronts`, requestOptions);
    const data = await response.json()

    if (data.subdomain) {
      dispatch({
        type: 'STOREFRONT_SAVED',
        payload: {
          ...data
        },
      })
    }
    return;

   } catch (error) {
     dispatch({ type: 'STOREFRONT_SAVE_ERROR', payload: { error }})
   }


}

export async function uploadLogo(
  // don't know the ts-type of file
  // @ts-ignore
  logo,
  subdomain: string,
  dispatch: React.Dispatch<any>,
) {
  const formData = new FormData();
  
  formData.append('logo', logo);
  formData.append('subdomain', subdomain);
  const response = await fetch(`/api/uploadLogo`, {
    method: 'POST',
    body: formData
  })

  if (response.ok) {
    const data = await response.json()
    dispatch({ type: 'LOGO_UPDATED', payload: { logoPath: data.logoPath } })
  }
}
 
export async function saveTheme(
    theme: StorefrontTheme,
    storefront: Storefront,
    dispatch: React.Dispatch<any>
  ) {
  const requestOptions = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme })
  };
  try {
    const response = await fetch(`/api/storefronts/${storefront.subdomain}`, requestOptions);
    const data = await response.json()

    if (data.theme) {
      dispatch({
        type: 'THEME_SAVED',
        payload: {
          ...data.theme
        },
      })
    }
    return;

   } catch (error) {
     dispatch({ type: 'THEME_SAVE_ERROR', payload: { error }})
   }
}