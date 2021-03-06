import { Map } from 'immutable';
import ConsoleLogFields from 'console/components/recipes/ConsoleLogFields';

describe('<ConsoleLogFields>', () => {
  const props = {
    disabled: false,
    recipeArguments: new Map(),
  };

  it('should work', () => {
    const wrapper = () => shallow(<ConsoleLogFields {...props} />);

    expect(wrapper).not.toThrow();
  });
});
