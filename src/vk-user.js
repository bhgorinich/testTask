import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-http-client';
import {Router} from 'aurelia-router';

@inject(HttpClient, Router)
export class User {
    wall = [];
    userId = '';
    user = {};

    constructor(http, router) {
        http.configure(config => { config.withBaseUrl('https://api.vk.com/method/'); });

        this.http = http;
        this.router = router;
    }

    activate(params, routeData){
        var that = this;
        this.userId = params.id;
        return this.getUser()
            .then(() => that.renderWall());
    }

    renderWall(){
        var that = this;
        return this.http.jsonp('wall.get?owner_id=' + this.user.id + '&filter=owner&v=5.50', 'callback')
            .then(function(httpResponse){
                if(httpResponse.response.error){
                    alert(httpResponse.response.error.error_msg);
                    throw httpResponse.response.error;
                }
                else{
                    return httpResponse.response.response.items;
                }
            }).then(wall => that.wall = wall);
    }

    getUser(){
        var that = this;
        return this.http.jsonp('users.get?user_id=' + this.userId + '&fields=sex,photo_50&v=5.50', 'callback')
            .then(function(httpResponse){
                if(httpResponse.response.error){
                    alert(httpResponse.response.error.error_msg);
                    throw httpResponse.response.error;
                }
                else{
                    return httpResponse.response.response;
                }
            }).then(users => that.user = users[0]);
    }
}
