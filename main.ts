import * as restify from 'restify';
import fetch from 'node-fetch';
import * as corsMiddleware from "restify-cors-middleware";

const server = restify.createServer({
    name: 'mercado-libre',
    version: '1.0.0'
});

const promise = (fetchPromise) => {
    return new Promise((resolve, reject) => {
        fetchPromise.then((result) => {
            result.json().then((jsonResult) => {
                resolve(jsonResult)
            })
        })
        .catch((error) => {
            reject(error);
        })
    })
}

const fetchApi = (url) => {
    return promise(fetch(url))
}

server.use(restify.plugins.queryParser())

const corsOptions: corsMiddleware.Options = {
    preflightMaxAge: 10,
    origins: ['*'],
    allowHeaders: ['*'],
    exposeHeaders: ['x-custom-header']
};
const cors: corsMiddleware.CorsMiddleware = corsMiddleware(corsOptions);

server.pre(cors.preflight);

server.use(cors.actual);

const getProducts = async (q): Promise<any> => {
    return (await fetchApi(`https://api.mercadolibre.com/sites/MLA/search?q=${q}`));
}

const getProductDescription = async (id): Promise<any> => {
    return (await fetchApi(`https://api.mercadolibre.com/items/${id}/description`));
}

const getProductDetail = async (id): Promise<any> => {
    return (await fetchApi(`https://api.mercadolibre.com/items/${id}`))
}

server.get('/api/items/:id', (req, resp, next) => {
    (async () => {
        const productDescription = await getProductDescription(req.params.id);
        const productDetailResult = await getProductDetail(req.params.id);
        let productDetail = {
            id: productDetailResult.id,
            title: productDetailResult.title,
            price: {
                currency: productDetailResult.currency_id,
                amount: productDetailResult.price,
                decimals: 0,
            },
            picture: productDetailResult.thumbnail,
            condition: productDetailResult.condition,
            free_shipping: productDetailResult.shipping.free_shipping,
            sold_quantity: productDetailResult.sold_quantity,
            description: productDescription.plain_text
        }
        resp.json({ 
            author: {
                name: "Bianca",
                lastname: "Arantes"
            },
            item: productDetail,
        });
    })().catch((err) => {
        console.log(err);
    });
    
    return next();
});

server.get('/api/items', (req, resp, next) => {
    let p = req.query;
    
    (async () => {
        const products = await getProducts(p.q);
        let productsResult =  products.results.map((product) => {
            return {
                id: product.id,
                title: product.title,
                price: {
                    currency: product.prices.presentation.display_currency,
                    amount: product.price,
                    decimals: 0,
                },
                picture: product.thumbnail,
                condition: product.condition,
                free_shipping: product.shipping.free_shipping,
                state_name: product.address.state_name
            }
        });
        let getCategories = products.filters.filter(p => p.id === "category");
        
        let categories = [];
        for (let i = 0; i < getCategories[0].values.length; i++) {
            categories.push(getCategories[0].values[i].path_from_root.map(path => path.name));
        }
        resp.json({ 
            author: {
                name: "Bianca",
                lastname: "Arantes"
            },
            items: productsResult, 
            categories: categories[0] 
        });
    })().catch((err) => {
        console.log(err);
    });
    
    return next();
});

server.listen(8086, () => {
    console.log('API is running on http://localhost:8086');
});
