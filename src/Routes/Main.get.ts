import User from "@/Middleware/User.ts";
import type App from "@/Utils/Classes/App.ts";
import Route from "@/Utils/Classes/Route.ts";

export default class Main extends Route {
    public constructor(App: App) {
        super(App);
        
        this.Route = "/";
        
        this.AllowedContentTypes = [];
        
        this.Middleware = [
            User({
                AccessType: "All",
                AllowedRequesters: "All",
                App
            })
        ]
    }
    
    public override Request() {
        return "Ok"
    }
}
