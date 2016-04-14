export class TestTask {
  configureRouter(config, router) {
    config.title = 'Тестовое задание, Пушкарёв Николай';
    config.map([
      { route: ['', 'home'], name: 'home', moduleId: 'home', nav: true, title: 'Задание 1' },
      { route: 'vk-user/:id', name: 'vk-user', moduleId: 'vk-user', nav: false, title: 'Пользователь' }
    ]);

    this.router = router;
  }
}
