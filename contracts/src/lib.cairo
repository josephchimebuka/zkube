mod constants;
mod events;
mod store;

mod models {
    mod index;
    mod game;
    mod player;
}

mod types {
    mod bonus;
    mod color;
    mod width;
}

mod elements {
    mod bonuses {
        mod interface;
    }
}

mod helpers {
    mod packer;
}

mod components {
    mod initializable;
    mod manageable;
    mod playable;
}

mod systems {
    mod actions;
}

#[cfg(test)]
mod tests {
    mod setup;
}
