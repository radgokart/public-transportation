# SF BART Trip Planner

You can view this app live:
https://rubalcava.github.io/public-transportation/

#### How to use
- Open up your teminal in the dist folder.
- From here, enter the command: python -m SimpleHTTPServer 8080
- In Chrome, navigate to localhost:8080
- This page will retrieve the SF BART schedule for the origin and destination stations that you pick. It will even cache any routes that you've previously searched for in case you find yourself offline (or the victim of lie-fi) and want to use it.

#### Current issues
* Need to implement checking for new pages and updating cache instead of serving the old cache always.
