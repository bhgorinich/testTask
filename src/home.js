import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-http-client';
import {Router} from 'aurelia-router';
import moment from 'moment';
import 'fetch';

@inject(HttpClient, Router)
export class Home {
    heading = 'Введите ID пользователя в ВКонтакте';
    userIdToAdd = '';
    users = [];
    friends = [];

    constructor(http, router) {
        http.configure(config => { config.withBaseUrl('https://api.vk.com/method/'); });

        this.http = http;
        this.router = router;
    }

    activate(params, routeData){
        var that = this;
        return new Promise(function(resolve, reject){
            that.routeData = routeData;
            that.userIdToAdd = routeData.settings.userIdToAdd || '';
            that.users = routeData.settings.users || [];
            that.friends = routeData.settings.friends || [];
            resolve();
        });
    }

    deactivate(){
        var that = this;
        return new Promise(function(resolve, reject){
            that.routeData.settings.userIdToAdd = that.userIdToAdd;
            that.routeData.settings.users = that.users;
            that.routeData.settings.friends = that.friends;
            resolve();
        });
    }

    addUser(){
        if(this.userIdToAdd) {
            var that = this;
            this.getUsersById(this.userIdToAdd)
            .then(function(usersToAdd){
                if(Array.isArray(usersToAdd)){
                    usersToAdd.forEach(function(newUser){
                        if(that.users.every(user => user.id !== newUser.id)){
                            that.users.push(newUser);
                        }
                    });
                }
                that.userIdToAdd = "";
            });
        }
    }

    removeUser(user){
        var index = this.users.indexOf(user);
        if(index > -1){
            this.users.splice(index, 1);
        }
    }

    build(){
        var that = this,
            arrFriends = [];

        var arrPromises = [];
        this.users.forEach(function(user){
            arrPromises.push(
                that.getFriendsByUser(user)
                    .then(newFriends => that.addFriends(arrFriends, newFriends))
            );
        });

        Promise.all(arrPromises).then(function() {
            arrFriends.sort(function(userA, userB){
                var nameA = userA.first_name + " " + userA.last_name,
                    nameB = userB.first_name + " " + userB.last_name;
                if(nameA < nameB){
                    return -1;
                }
                else if(nameA > nameB){
                    return 1;
                }
                else{
                    return 0;
                }
            });

            arrPromises = [];
            arrFriends.forEach(function(friend){
                friend.backgroundStyle = that.getColorizeByFriend(friend);
                if(/\d{1,2}\.\d{1,2}.\d{4}/ig.test(friend.bdate)){
                    moment.locale("ru");
                    var bdateMoment = moment(friend.bdate, "DD.MM.YYYY");
                    if(moment.isMoment(bdateMoment)){
                        friend.age = moment.duration(moment().subtract(bdateMoment.toDate().valueOf()).valueOf(), "milliseconds").humanize();
                    }
                    else{
                        friend.age = "";
                    }
                }
            });
            return Promise.all(arrPromises);
        }).then(function(){
            that.friends = arrFriends;
        });
    }

    getUsersById(id){
        return this.http.jsonp('users.get?user_id=' + id + '&fields=sex,photo_50&v=5.50', 'callback')
            .then(function(httpResponse){
                if(httpResponse.response.error){
                    alert(httpResponse.response.error.error_msg);
                    throw httpResponse.response.error;
                }
                else{
                    return httpResponse.response.response;
                }
            });
    }

    getFriendsByUser(user){
        if(user && user.id) {
            return this.http.jsonp('friends.get?user_id=' + user.id + '&order=random&fields=sex,bdate,photo_50&v=5.50', 'callback')
                .then(function(httpResponse){
                    var response = httpResponse.response;
                    if(response.error){
                        alert(httpResponse.response.error.error_msg);
                        throw httpResponse.response.error;
                    }
                    else{
                        return response.response.items;
                    }
                });
        }
        else{
            throw "getFriendsByUser: invalid user";
        }
    }

    addFriends(arrFriends, arrFriendsToAdd){
        if(Array.isArray(arrFriendsToAdd) && arrFriendsToAdd.length){
            arrFriendsToAdd.forEach(function(newFriend){
                if(arrFriends.every(function(friend){
                        if(friend.id == newFriend.id){
                            friend.friendsCountFromUsers++;
                            return false;
                        }
                        else{
                            return true;
                        }
                    })){
                    newFriend.friendsCountFromUsers = 1;
                    arrFriends.push(newFriend);
                }
            });
        }
    }

    getColorizeByFriend(friend){
        if(friend.friendsCountFromUsers > 1 && this.users.length > 1){
            return "background-color: rgba(0, 169, 242, " + (friend.friendsCountFromUsers / this.users.length) + "); color: white;";
        }
        else{
            return "background-color: transparent";
        }
    }
}
