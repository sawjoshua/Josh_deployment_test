# Josh Admin Dashboard

A React application with a customer storefront at `/` and an admin dashboard for Saw Joshua at `/admin`. It uses the [DummyJSON Products API](https://dummyjson.com/docs/products) and [Carts API](https://dummyjson.com/docs/carts). The storefront lets customers browse, search, and filter products and keep a temporary shopping bag in the browser. The admin dashboard provides catalog metrics, product and cart search, filtering, sorting, pagination, and product/cart create, edit, and delete controls.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.
4. Run `npm run build` to create the production site in `dist/`.
5. Visit `/` for the customer shop and `/admin` for the admin dashboard.

## Publish on Netlify

1. Push this folder to a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project** and connect that repository.
3. Set the build command to `npm run build` and publish directory to `dist`.
4. Deploy. No API key or environment variable is required for DummyJSON's public product endpoints.

Vercel works too: import the repository, choose the Vite preset, and use `npm run build` with `dist` as the output directory.

## API behavior to know

DummyJSON is a mock API. Product and cart reads come from its sample dataset. POST, PUT, and DELETE responses simulate successful writes but do not persist changes on the server. This UI reflects write results during the current browser session; refreshing reloads the original API data. Use a database-backed API if you need real, persistent catalog management.

The dashboard identifies Saw Joshua as its administrator, but it is a demonstration interface without login or access protection. Anyone who can visit `/admin` can use its admin controls. The customer bag is temporary and checkout is a demonstration; no order is submitted. Do not use this as a real store until you add backend authentication, authorization, order processing, and persistent storage.
