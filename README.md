# Stormpath is Joining Okta
We are incredibly excited to announce that [Stormpath is joining forces with Okta](https://stormpath.com/blog/stormpaths-new-path?utm_source=github&utm_medium=readme&utm-campaign=okta-announcement). Please visit [the Migration FAQs](https://stormpath.com/oktaplusstormpath?utm_source=github&utm_medium=readme&utm-campaign=okta-announcement) for a detailed look at what this means for Stormpath users.

We're available to answer all questions at [support@stormpath.com](mailto:support@stormpath.com).

## What does this mean for developers who are using this library?

* If you have upgraded to the 2.x series from 1.x, you should downgrade to 1.1.1.  Why?  The 2.x series depends on the Stormpath Client API, which will not be migrated to the Okta platform.
* When downgrading to 1.1.1 you will need to use one of our backend framework integrations to serve the APIs that the 1.x series depends on.
* These backend integrations are being patched to work with Okta:
 - [Java Spring](https://docs.stormpath.com/java/#tab3)
 - [Java Spring Boot](https://docs.stormpath.com/java/#tab1)
 - [Node Express](https://docs.stormpath.com/nodejs/)
 - [ASP.NET 4.x](https://docs.stormpath.com/dotnet/#tab3)
 - [ASP.NET Core](https://docs.stormpath.com/dotnet/#tab2)
* If you are using the Express integration, please see the [Express-Stormpath Angular Sample Project][], it can be used to test your migration to Okta.

# README

If you are actively using this library, you can find the old readme in [OLD-README.md](OLD-README.md). It is not possible to register for new Stormpath tenants at this time, so you must already have a Stormpath tenant if you wish to use this library during the migration period.

[Express-Stormpath Angular Sample Project]: https://github.com/stormpath/express-stormpath-angular-sample-project
