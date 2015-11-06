# Troubleshooting

This document contains a list of common problems that you may run into while
working with this library.

#### "Invalid username or password." when using Social Login

If you are using [express-stormpath][] as your back-end you may see this error
when attempting a social login.  This happens if the Body Parser module is
configured before the Express Stormpath module.  If you must do this, please
ensure that you are enabling the extended option for the parser:

```javascript
app.use(bodyParser.urlencoded({ extended: true }));
```

This issue is being tracked here:

https://github.com/stormpath/express-stormpath/issues/194

[express-stormpath]: https://github.com/stormpath/express-stormpath